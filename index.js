var Download = require("download");
var gitclone = require("git-clone");
var rm = require("rimraf").sync;

/**
 * Expose `download`.
 */

module.exports = download;

/**
 * Download `repo` to `dest` and callback `fn(err)`.
 *
 * @param {String} repo
 * @param {String} dest
 * @param {Function} fn
 */

function download(repo, dest, opts, fn) {
  if (typeof opts === "function") {
    fn = opts;
    opts = null;
  }
  opts = opts || {};
  opts.clone = opts.clone || false;

  repo = normalize(repo);
  var url = getUrl(repo, opts);

  if (opts.clone) {
    gitclone(url, dest, { checkout: repo.checkout }, function(err) {
      if (err === undefined) {
        rm(dest + "/.git");
        fn();
      }
      else {
        fn(err);
      }
    });
  }
  else {
    new Download({ mode: "666", extract: true, strip: 1 }).get(url).dest(dest).run(function(err, files) {
      err === null ? fn() : fn(err);
    });
  }
}

/**
 * Normalize a repo string.
 *
 * @param {String} string
 * @return {Object}
 */

function normalize(repo) {
  var regex = /^((github|gitlab|bitbucket):)?((.+):)?([^/]+)\/([^#]+)(#(.+))?$/;
  var match = regex.exec(repo);
  var type = match[2] || "github";
  var host = match[4] || null;
  var owner = match[5];
  var name = match[6];
  var checkout = match[8] || "master";

  if (host == null) {
    if (type === "github")
      host = "github.com";
    else if (type === "gitlab")
      host = "gitlab.com";
    else if (type === "bitbucket")
      host = "bitbucket.com";
  }

  return {
    type: type,
    host: host,
    owner: owner,
    name: name,
    checkout: checkout
  };
}

/**
 * Return a zip or git url for a given `repo`.
 *
 * @param {Object} repo
 * @return {String}
 */

function getUrl(repo, opts) {
  var url;

  if (repo.type === "github")
    url = github(repo, opts);
  else if (repo.type === "gitlab")
    url = gitlab(repo, opts);
  else if (repo.type === "bitbucket")
    url = bitbucket(repo, opts);
  else
    url = github(repo, opts);

  return url;
}

/**
 * Return a GitHub url for a given `repo` object.
 *
 * @param {Object} repo
 * @return {String}
 */

function github(repo, opts) {
  var url;
  
  if (opts.clone)
    url = "git@" + repo.host + ":" + repo.owner + "/" + repo.name + ".git";
  else
    url = "https://" + repo.host + "/" + repo.owner + "/" + repo.name + "/archive/" + repo.checkout + ".zip";

  return url;
}

/**
 * Return a GitLab url for a given `repo` object.
 *
 * @param {Object} repo
 * @return {String}
 */

function gitlab(repo, clone) {
  var url;
  var httpProtocol = opts.security === false? "http://": "https://";

  if (clone)
    url = "git@" + repo.host + ":" + repo.owner + "/" + repo.name + ".git";
  else
    url = httpProtocol + repo.host + "/" + repo.owner + "/" + repo.name + "/repository/archive.zip?ref=" + repo.checkout;

  return url;
}

/**
 * Return a Bitbucket url for a given `repo` object.
 *
 * @param {Object} repo
 * @return {String}
 */

function bitbucket(repo, clone) {
  var url;

  if (clone)
    url = "git@" + repo.host + ":" + repo.owner + "/" + repo.name + ".git";
  else
    url = "https://" + repo.host + "/" + repo.owner + "/" + repo.name + "/get/" + repo.checkout + ".zip";

  return url;
}
