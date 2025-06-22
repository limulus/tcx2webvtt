#!/usr/bin/env bash

# See: https://github.com/actions/runner-images/issues/10977#issuecomment-2681219742

echo 'set man-db/auto-update false' | sudo debconf-communicate >/dev/null
sudo dpkg-reconfigure man-db
