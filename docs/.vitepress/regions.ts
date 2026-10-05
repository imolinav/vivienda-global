// Single source of truth for region folders. The key is the folder name
// under docs/paises/, the value is the label shown in the UI. Both the
// sidebar builder (Node, build time) and CountryList.vue (browser) import
// this, so adding a region means adding one line here plus the folder.
// Order of the entries is the order regions appear on the site.
export const REGIONS: Record<string, string> = {
  europa: 'Europa',
  asia: 'Asia',
  america: 'América',
  africa: 'África',
  oceania: 'Oceanía',
}
