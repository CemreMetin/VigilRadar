#!/bin/sh
# The checks run after every change: types, lint, tests, build, then the 390 px overflow check on the served build.
npx next typegen >/dev/null && npx tsc --noEmit && npm run lint 2>&1 | tail -2 && npm test 2>&1 | tail -1 && npm run build 2>&1 | grep -iE "error|build-search" ; (node scripts/serve-out.mjs 8081 >/dev/null 2>&1 &) ; sleep 2; node scripts/check-overflow.mjs | grep -c WIDE || true
