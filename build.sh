#!/bin/sh
# Vercel serves ./public as the site root when no output directory is set,
# so copy the whole static site into ./dist and serve that instead.
set -e
rm -rf dist
mkdir dist
cp *.html *.css *.js robots.txt sitemap.xml dist/
cp -R public locales config dist/
