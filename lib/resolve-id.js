"use strict"

// external tooling
const resolve = require("resolve")
const path = require('path')

const moduleDirectories = [ "web_modules", "node_modules" ]

function resolveModule(id, opts) {
  return new Promise((res, rej) => {
    resolve(id, opts, (err, path) => (err ? rej(err) : res(path)))
  })
}

module.exports = function (id, base, options) {
  const { paths, root: stylesRoot, alias, addModulesDirectories } = options

  const resolveOpts = {
    basedir: base,
    moduleDirectory: moduleDirectories.concat(addModulesDirectories),
    paths: paths,
    extensions: [ ".css" ],
    packageFilter: function processPackage(pkg) {
      if (pkg.style) pkg.main = pkg.style
      else if (!pkg.main || !/\.css$/.test(pkg.main)) pkg.main = "index.css"
      return pkg
    },
    preserveSymlinks: false,
  }

  let preResolved = id

  if (alias) {
    Object.keys(alias).forEach((item) => {
      preResolved = preResolved.replace(item, path.resolve(stylesRoot, alias[ item ]))
    })
  }

  return resolveModule(preResolved, resolveOpts)
    .catch(() => resolveModule(id, resolveOpts))
    .catch(() => {
      if (paths.indexOf(base) === -1) paths.unshift(base)

      throw new Error(
        `Failed to find '${id}'
  in [
    ${paths.join(",\n        ")}
  ]`
      )
    })
}
