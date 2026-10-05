#!/usr/bin/env bash
# Last step of the daily job (.github/workflows/actualizar.yml): decide what
# reaches main. The deterministic data update is already committed locally
# as BASE_SHA; the agent's edits, if any, are uncommitted on top of it.
#
# - Everything verified: commit the agent's edits and push.
# - Agent or verification failed: drop the agent's edits, keep the data
#   commit if it still verifies on its own, and open an issue.
# - Doubts from the agent or failing sources: publish what passed and
#   open an issue anyway, so nothing that needs Ian goes unnoticed.
#
# Inputs (env): BASE_SHA, AGENTE, COMPILA, VERIFICA (step outcomes).
set -euo pipefail

FECHA=$(TZ=Europe/Madrid date +%F)
SALIDA=automatizacion/salida
PROBLEMAS=""

revertir_agente() {
  git checkout "$BASE_SHA" -- docs investigacion
  git clean -fdq docs investigacion
}

if [[ "$AGENTE" == "failure" ]]; then
  PROBLEMAS+=$'- El agente no terminó correctamente; sus cambios se han descartado.\n'
  revertir_agente
elif [[ "$COMPILA" != "success" || "$VERIFICA" != "success" ]]; then
  PROBLEMAS+=$'- Los cambios no pasaron la compilación o la verificación y se han descartado.\n\n'
  [[ -f $SALIDA/verificacion.md ]] && PROBLEMAS+="$(cat $SALIDA/verificacion.md)"$'\n'
  revertir_agente
fi

if [[ -n "$PROBLEMAS" ]]; then
  # The data commit must stand on its own before it is published.
  if ! (npm run build >/dev/null && npx tsx automatizacion/src/verificar.ts --html >/dev/null); then
    PROBLEMAS+=$'- Los datos automáticos tampoco pasan la verificación: no se publica nada hoy.\n'
    git reset -q --hard origin/main
  fi
elif [[ -n "$(git status --porcelain -- docs investigacion)" ]]; then
  git add -A docs investigacion
  git commit -q -m "Actualización automática del $FECHA: novedades" -m "$(cat $SALIDA/informe.md 2>/dev/null || true)"
fi

# One issue per day collecting everything that needs a human.
CUERPO=""
[[ -n "$PROBLEMAS" ]] && CUERPO+=$'## Cambios descartados\n\n'"$PROBLEMAS"$'\n'
[[ -s $SALIDA/dudas.md ]] && CUERPO+=$'## Dudas del agente\n\n'"$(cat $SALIDA/dudas.md)"$'\n\n'
[[ -s $SALIDA/avisos.md ]] && CUERPO+=$'## Fuentes que fallan\n\n'"$(cat $SALIDA/avisos.md)"$'\n\n'
if [[ -n "$CUERPO" ]]; then
  if [[ -s $SALIDA/novedades.json && "$(cat $SALIDA/novedades.json)" != "[]" ]]; then
    CUERPO+=$'## Novedades detectadas\n\n'
    CUERPO+="$(node -e 'for (const n of require("./automatizacion/salida/novedades.json")) console.log(`- [${n.pais}] ${n.titulo} (${n.detalle ?? ""}) ${n.url}`)')"$'\n\n'
  fi
  [[ -s $SALIDA/informe.md ]] && CUERPO+=$'## Informe del agente\n\n'"$(cat $SALIDA/informe.md)"$'\n'
  gh issue create --title "Actualización automática del $FECHA: revisión necesaria" --body "$CUERPO"
fi

if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
  # Ian may have pushed while the job ran; replay our commits on top.
  git pull -q --rebase origin main
  git push -q origin HEAD:main
  # Pushes made with GITHUB_TOKEN do not trigger workflows, except
  # workflow_dispatch, so the deploy is started explicitly.
  gh workflow run deploy.yml --ref main
  echo "Publicado: $(git log --oneline origin/main..HEAD 2>/dev/null | wc -l) commits"
else
  echo "Sin cambios que publicar"
fi
