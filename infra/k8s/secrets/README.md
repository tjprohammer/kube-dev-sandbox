# Sandbox Secrets

Some application settings (Mapbox tokens, API hostnames, database credentials, etc.) should not be committed to source control. Use the sample manifests in this directory to create environment-specific secrets:

1. Copy `frontend-secrets.sample.yaml` to `frontend-secrets.local.yaml`.
2. Copy `db-secrets.sample.yaml` to `db-secrets.local.yaml` and edit the credentials/passwords.
3. Replace the placeholder values with your real Mapbox token, PostgreSQL credentials, and Redis password.
4. Apply the rendered secrets before (or as part of) `make up`:
   ```powershell
   kubectl apply -f infra/k8s/secrets/frontend-secrets.local.yaml
   kubectl apply -f infra/k8s/secrets/db-secrets.local.yaml
   ```

The Makefile automatically looks for `frontend-secrets.local.yaml` and applies it when present. If you prefer kubectl imperatively, run:

```powershell
kubectl create secret generic frontend-secrets \
  -n sandbox-app \
  --from-literal=MAPBOX_ACCESS_TOKEN=<token> \
  --from-literal=PUBLIC_API_BASE_URL=http://api.photo.local

kubectl create secret generic db-secrets \
  -n sandbox-app \
  --from-literal=POSTGRES_USER=<user> \
  --from-literal=POSTGRES_PASSWORD=<pass> \
  --from-literal=POSTGRES_DB=locations \
  --from-literal=DATABASE_URL=postgresql+psycopg://<user>:<pass>@postgresql.sandbox-app.svc.cluster.local:5432/locations \
  --from-literal=REDIS_PASSWORD=<redis-pass>
```

Keep the `.local.yaml` files out of version control. The `.gitignore` in this folder already excludes them.
