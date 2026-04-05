#!/usr/bin/env bash
set -euo pipefail
APP_UID=$(id -u)
APP_UID=$APP_UID ./deploy.sh
