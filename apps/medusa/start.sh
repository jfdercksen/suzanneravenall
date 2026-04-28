#!/usr/bin/env sh
set -eu

# Run migrations from project root — medusa-config.js is here, DATABASE_URL from env
node_modules/.bin/medusa db:migrate

# Symlink root node_modules into .medusa/server so medusa start can find packages
if [ ! -e ".medusa/server/node_modules" ]; then
    ln -s /server/node_modules .medusa/server/node_modules
fi

# Start from inside the built bundle
cd .medusa/server
exec node_modules/.bin/medusa start
