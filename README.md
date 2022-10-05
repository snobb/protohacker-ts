# protohacker-ts

Protohacker challenges implementation in TypeScript


## Fly.io

In order to deploy to fly.io follow the steps below:

```
# Authenticate to fly.io
$ flyctl auth login

# use the existing fly.toml
$ flyctl launch

# this command uses the local docker instance to build the image).
$ flyctl deploy --local-only
```