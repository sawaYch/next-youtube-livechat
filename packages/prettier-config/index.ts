module.exports = {
  "trailingComma": "es5",
  "semi": true,
  "tabWidth": 2,
  "singleQuote": true,
  "jsxSingleQuote": true,
  "importOrder": [
    "^@core/(.*)$",
    "^@server/(.*)$",
    "^@ui/(.*)$",
    "^[./]",
    "^@/components/(.*)$",
    "^@/lib/(.*)$"
  ],
  "importOrderSeparation": true,
  "importOrderSortSpecifiers": true,
  "plugins": [
    "prettier-plugin-tailwindcss",
    "@trivago/prettier-plugin-sort-imports"
  ]
}
