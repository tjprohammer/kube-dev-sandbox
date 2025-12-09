# Kube Dev Sandbox

A local Kubernetes sandbox to learn **Kubernetes**, **containers**, **CI/CD**, **security**, and **monitoring** by building a small but realistic multi-service application.

Everything runs **locally** using:

- Docker Desktop (Windows, WSL2 engine)
- Kubernetes via **minikube**
- `kubectl` + `helm`
- GitHub + GitHub Actions (for CI)

The goal is to simulate a small production-style system and use it to practice:

- Deploying multiple services on Kubernetes
- Managing deployments, services, ingress, config, and secrets
- Adding basic security (RBAC, resource limits)
- Setting up monitoring (Prometheus + Grafana)
- Building CI pipelines (GitHub Actions) for builds/tests/images

---

## 1. High-Level Architecture

This sandbox models a small, cloud-native app with multiple services:

- **`api`** – Backend API (Python / FastAPI)
  - Endpoints like `/health`, `/stats`, `/notify`
- **`notifications`** – Mock multi-channel notification service (FastAPI)
  - Endpoints: `POST /send`, `GET /stats`, `GET /healthz`
  - Routed through the Gateway at `notify.sandbox.local`
- **`frontend`** – Simple web UI (static or React built + served via Nginx)
- **(Later) `worker`** – Background / cron-like tasks (e.g. cleanup, scheduled jobs)

All services are:

- Containerized with **Docker**
- Deployed to a local **Kubernetes** cluster (minikube)
- Grouped into a `sandbox-app` **namespace**
- Exposed through the **Gateway API (Contour + Envoy)** with hostnames:
  - `sandbox.local` → api service (FastAPI)
  - `notify.sandbox.local` → notifications service
  - Additional hosts (e.g., `ui.sandbox.local`) will be added for frontend once available

Cross-cutting concerns (config, secrets, RBAC, ingress, monitoring) live in the `infra` directory.

---

## 2. Repository Structure

Planned layout:

`````text
kube-dev-sandbox/
  ````markdown
  # Kube Dev Sandbox

  A local Kubernetes sandbox to learn **Kubernetes**, **containers**, **CI/CD**, **security**, and **monitoring** by building a small but realistic multi-service application.

  Everything runs **locally** using:

  - Docker Desktop (Windows, WSL2 engine)
  - Kubernetes via **minikube**
  - `kubectl` + `helm`
  - GitHub + GitHub Actions (for CI)

  The goal is to simulate a small production-style system and use it to practice:

  - Deploying multiple services on Kubernetes
  - Managing deployments, services, ingress, config, and secrets
  - Adding basic security (RBAC, resource limits)
  - Setting up monitoring (Prometheus + Grafana)
  - Building CI pipelines (GitHub Actions) for builds/tests/images

  ---

  ## 1. High-Level Architecture

  This sandbox models a small, cloud-native app with multiple services:

  - **`api`** – Backend API (Python / FastAPI) with health/stats endpoints
  - **`notifications`** – Mock notification service with `/send`, `/stats`, `/healthz`
  - **`frontend`** – Simple web UI (static/React build served by Nginx)
  - **`worker`** *(later)* – Cron-style jobs for cleanup or scheduled tasks

  All services are:

  - Containerized with **Docker**
  - Deployed to a local **Kubernetes** cluster (minikube)
  - Grouped into a `sandbox-app` **namespace**
  - Exposed through the **Gateway API (Contour + Envoy)** with hostnames like `sandbox.local` (api) and `notify.sandbox.local` (notifications)

  Cross-cutting concerns (config, secrets, RBAC, ingress, monitoring) live in the `infra` directory.

  ---

  ## 2. Repository Structure

  Planned layout:
  ```text
  kube-dev-sandbox/
    services/
      api/
        main.py
        requirements.txt
        Dockerfile
        k8s/
          deployment.yaml
          service.yaml
      notifications/
        main.py
        requirements.txt
        Dockerfile
        k8s/
          deployment.yaml
          service.yaml
      frontend/
        Dockerfile
        nginx.conf (optional)
        index.html or React build/
        k8s/
          deployment.yaml
          service.yaml
      worker/
        main.py
        Dockerfile
        k8s/
          cronjob.yaml
    infra/
      k8s/
        namespace.yaml
        configmap.yaml
        secrets.yaml
        rbac.yaml
        ingress.yaml
      monitoring/
        prometheus-values.yaml
        grafana-values.yaml
    .github/
      workflows/
        ci.yml
    README.md
`````

---

## 3. Upcoming Enhancements / To-Dos

### Gateway API quickstart (local)

Follow these steps to expose any namespace-scoped HTTP service through the Contour + Envoy Gateway stack:

> **Fast path**: after `minikube start`, run `make up` to build both images, load them into Minikube, and reapply every manifest (namespace, services, Deployments, Gateway stack). Then:
>
> 1. Start `minikube tunnel` in another terminal and confirm `kubectl get svc -n projectcontour envoy` shows `127.0.0.1`.
> 2. Run `make smoke-test` (local curl) and `make smoke-test-cluster` (in-cluster curl) to verify routing end-to-end.
> 3. Repeat `make up && make smoke-test` any time you reboot Docker/Minikube or change application code. The detailed manual steps remain below for reference.

1. **Prerequisites**
   - Docker Desktop with Kubernetes enabled
   - Minikube running (`minikube start`)
   - Gateway API CRDs installed (Contour quickstart already handles this)
2. **Deploy / refresh application workloads**
   ```powershell
   kubectl apply -f infra/k8s/namespace.yaml
   kubectl apply -f services/api/k8s/deployment.yaml
   kubectl apply -f services/api/k8s/service.yaml
   kubectl apply -f services/notifications/k8s/deployment.yaml
   kubectl apply -f services/notifications/k8s/service.yaml
   kubectl get pods -n sandbox-app
   ```
   Ensure both `api` and `notifications` pods are `Running/Ready` (two replicas each).
3. **Deploy / update the Gateway stack**
   ```powershell
   kubectl apply -f infra/k8s/gatewayclass.yaml
   kubectl apply -f infra/k8s/gateway.yaml
   kubectl apply -f infra/k8s/api-route.yaml
   kubectl apply -f infra/k8s/notifications-route.yaml
   kubectl apply -f infra/k8s/contour-config.yaml
   kubectl rollout restart deployment contour -n projectcontour
   kubectl rollout status  deployment contour -n projectcontour
   ```
4. **Verify status**
   ```powershell
   kubectl describe gatewayclass contour-sandbox
   kubectl describe gateway sandbox-gateway -n sandbox-app
   kubectl get httproute api-route -n sandbox-app -o yaml
   kubectl get httproute notifications-route -n sandbox-app -o yaml
   ```
   `Accepted=True` and `Programmed=True` indicate the controller has attached listeners and routed the HTTPRoute(s).
5. **Start the tunnel / expose Envoy**
   - Run `minikube tunnel` in a dedicated terminal (leave it running).
   - Check the external IP: `kubectl get svc -n projectcontour envoy` ⇒ typically `127.0.0.1` on Windows.
   - Add both hosts to your hosts file: `127.0.0.1 sandbox.local` and `127.0.0.1 notify.sandbox.local`.
6. **Smoke test HTTP endpoints**
   ```bash
   curl -H "Host: sandbox.local" http://127.0.0.1/health
   curl -H "Host: sandbox.local" http://127.0.0.1/stats
   curl -H "Host: notify.sandbox.local" http://127.0.0.1/healthz
   curl -H "Host: notify.sandbox.local" http://127.0.0.1/stats
   curl -H "Host: notify.sandbox.local" http://127.0.0.1/send -X POST \
     -H "Content-Type: application/json" \
     -d '{"channel":"email","recipient":"dev@example.com","message":"hello from gateway"}'
   ```
   (All of the above run automatically via `make smoke-test` once the tunnel and hosts entries exist.)
   Or run the tests in-cluster:
   ```powershell
   kubectl run curl-test --rm -i --tty --image=curlimages/curl --restart=Never -- \
     curl -s -H "Host: sandbox.local" http://envoy.projectcontour.svc.cluster.local/health
   kubectl run notify-test --rm -i --tty --image=curlimages/curl --restart=Never -- \
     curl -s -H "Host: notify.sandbox.local" http://envoy.projectcontour.svc.cluster.local/healthz
   ```
   (`make smoke-test-cluster` wraps both of these in-cluster checks.)
7. **Cleanup**
   - Stop the tunnel with `Ctrl+C` when finished.
   - Remove the hosts entries if desired.

These steps belong in CI as well: after `kubectl apply`, run `kubectl wait --for=condition=Programmed gateway/sandbox-gateway -n sandbox-app --timeout=90s` followed by the in-cluster curl to guard regressions.

### Makefile reference

- `make up` – Build the API + notifications images, load them into Minikube, and (re)apply all manifests (namespace, Deployments, Services, GatewayClass/Gateway/HTTPRoutes, and Contour config) before waiting for deployments to roll out.
- `make smoke-test` – Run the local curl suite against `sandbox.local` and `notify.sandbox.local`. Requires `minikube tunnel` plus hosts file entries that point to `127.0.0.1` (override with `HOST_IP=x.x.x.x make smoke-test`).
- `make smoke-test-cluster` – Launch ephemeral curl pods inside the cluster that hit the Envoy service directly; useful for CI or validating routing without touching the hosts file.
- `make build`, `make load-images`, `make apply-app`, `make apply-gateway` – Component-level targets used by `make up` if you want to run individual phases (e.g., iterate on Deployments without rebuilding images).
- `make apply-monitoring` – Apply only the Prometheus + Grafana manifests (`infra/k8s/prometheus.yaml`, `infra/k8s/grafana.yaml`) if you want to redeploy dashboards without rebuilding the app images.
- `make push REGISTRY=docker.io/you IMAGE_TAG=dev` – Build both services (if needed), ensure `REGISTRY` is set, then `docker push` the tagged images so any cluster—not just Minikube—can pull them. Works with any registry prefix (Docker Hub `docker.io/you`, GHCR `ghcr.io/you`, etc.).
- `IMAGE_TAG` (default `v1`) and `REGISTRY` are opt-in variables understood by every build/deploy target. For example, `make up IMAGE_TAG=dev` keeps everything local, while `make up REGISTRY=ghcr.io/you IMAGE_TAG=dev` ensures Deployments reference `ghcr.io/you/api-service:dev` and Minikube receives that exact image name via `minikube image load`.

> We validated the workflow end-to-end by stopping Minikube, starting it fresh, and running `make up` → all images reloaded, manifests re-applied, and rollouts completed without manual intervention.

### Observability quickstart (Prometheus + Grafana)

1. Deploy or refresh the monitoring stack via `make up` (includes `apply-monitoring`) or run `make apply-monitoring` explicitly.
2. Port-forward the services when you want to inspect them locally:

```powershell
kubectl port-forward svc/prometheus-server -n sandbox-app 9090:80
kubectl port-forward svc/grafana -n sandbox-app 3000:80
```

Grafana credentials live in `infra/k8s/grafana.yaml` (`admin` / `dev-password`). 3. Visit `http://localhost:3000`, open the **Sandbox Traffic** dashboard, and watch:

- `api_requests_total` – custom counter incremented by each FastAPI handler.
- `notifications_sent_total{channel="email"|"sms"|"push"}` – derived from the notifications service.
- Default latency/error metrics from `prometheus-fastapi-instrumentator` under `/metrics` on every service.

4. Prometheus is available at `http://localhost:9090` for ad-hoc queries; try `notifications_sent_total` or `rate(api_requests_total[5m])` to validate scraping.

Because `/metrics` is exposed on the same pods/ports as the application traffic, the Prometheus deployment simply scrapes the ClusterIP services (`api` and `notifications`), so new services only need FastAPI instrumentation + an entry in `infra/k8s/prometheus.yaml` to appear automatically.

### Jenkins CI/CD quickstart

Spin up a local Jenkins master (or point to an existing one) to turn the sandbox into a push-button CI/CD exercise:

1. **Run Jenkins** – The quickest option is Docker:
  ```powershell
  docker run -d --name jenkins --restart=unless-stopped -p 8080:8080 -p 50000:50000 \
    -v jenkins-home:/var/jenkins_home jenkins/jenkins:lts-jdk17
  ```
  Install the recommended plugins plus `Docker` and `Pipeline` if they are not already present. Ensure the agent that executes the job has `docker`, `kubectl`, `make`, and `git` available on its `$PATH`.
2. **Create credentials** – The Jenkinsfile expects two IDs:
  - `sandbox-registry-creds` → *Username with password* storing your registry login. For GHCR use your GitHub username and a PAT with `write:packages` + `read:packages` scopes.
  - `sandbox-kubeconfig` → *Secret file* that contains a kubeconfig with access to the cluster you plan to deploy to (optional if you leave `DEPLOY_TO_CLUSTER=false`).
3. **Create a Pipeline job** – Point it at this repository and keep the Script Path as `Jenkinsfile`. Multibranch works as well if you want every branch to run automatically.
4. **Supply parameters at build time**:
  - `REGISTRY_PREFIX` should include the registry host *and* namespace (e.g., `ghcr.io/your-gh-username`). The Makefile automatically appends `api-service` / `notifications-service`.
  - `IMAGE_TAG` defaults to the current commit SHA when left empty.
  - `DEPLOY_TO_CLUSTER` controls whether the job applies manifests + rollouts using the provided kubeconfig.
5. **Pipeline stages** – Lint the FastAPI services inside a disposable `python:3.12-slim` container, build images via `make build`, authenticate to the registry once, push both images, and (optionally) call `make apply-*` + `kubectl rollout status` to update the cluster using the freshly pushed tag.

The Jenkins logs will show the computed tag and registry path (`ghcr.io/<you>/api-service:<tag>`). Because the pipeline relies on the existing Makefile targets, any future services that participate in `make build`/`make push` are included automatically—just update the Makefile and Jenkins inherits the change.

To make the sandbox mirror a production-ready startup environment, these additions are queued up:

- **Ingress + Edge Routing**: Enable the minikube Nginx ingress addon, apply `infra/k8s/ingress.yaml`, and wire up TLS (self-signed locally, Cert-Manager later).
- **Service Exposure Patterns**: Compare `ClusterIP`, `NodePort`, and `LoadBalancer` (with `minikube tunnel`) and document when to choose each.
- **Registry & CI/CD Pipeline**: Push versioned images to a registry (GHCR/ECR/GCR), have GitHub Actions build/scan/tag them, and deploy via GitOps or authenticated `kubectl`.
- **Configuration & Secrets**: Add per-environment overlays (Helm/Kustomize), encrypted secrets (SOPS/SealedSecrets), and enforce resource requests/limits.
- **Networking & Security**: Layer NetworkPolicies, tighten RBAC/service accounts, and consider OPA/Gatekeeper policies plus audit logging.
- **Observability**: Finish Prometheus/Grafana wiring, add alert rules, log aggregation (Loki/ELK), and basic tracing with OpenTelemetry.
- **Scalability & Releases**: Configure HPAs, PodDisruptionBudgets, rolling/canary deployments, and scripted rollbacks.
- **Developer Experience**: Provide onboarding scripts (Make/Tilt/Skaffold), preview environments, and runbooks for new contributors.

### Next Sandbox Iterations

- **Services**: build out the `frontend` experience, wire it to the API/notifications services via internal DNS, and add a background `worker` (CronJob) for async flows.
- **Traffic policies**: introduce multiple HTTPRoutes (per subdomain/path), experiment with weighted routing, retries, and timeouts via Gateway API filters.
- **Cluster scale**: add more Minikube nodes (`minikube node add`) to practice spreading pods, PodAntiAffinity, and simulate zone disruption handling.
- **Automation**: create a Makefile or Taskfile target (`make apply-gateway`, `make smoke-test`) so the whole workflow runs with one command and can be mirrored in CI.

### Feature Backlog (detailed)

- **Frontend host (`ui.sandbox.local`)** – Static/React bundle served via Nginx, fronted by its own HTTPRoute and Deployment so we can test multi-host routing end-to-end.
- **Notification worker + queue** – Introduce Redis or another lightweight broker, add a CronJob/worker Deployment that consumes queued notifications, and extend the API to enqueue vs. fire-and-forget.
- **Observability stack 2.0** – Layer alert rules, log aggregation (Loki/ELK), and distributed tracing (OTel + Tempo/Jaeger) on top of the current Prometheus + Grafana setup, then wire notifications to Slack/email for real incident drills.
- **Secrets & config hardening** – Move secrets into dedicated manifests (optionally SOPS/SealedSecrets), wire ConfigMaps into pods, and enforce resource limits + NetworkPolicies.
- **CI/CD integration** – Author GitHub Actions that lint/test, build container images, push to `REGISTRY`, and invoke `kubectl` (or GitOps) to apply manifests, mirroring the `make up` flow.
- **Developer tooling** – Add Make/Task targets for `minikube tunnel`, hosts-file helpers, and cleanup so onboarding a new engineer is a single command set.

### Detailed Requirements & Practices

- **Ingress Architecture**
  - Run an ingress controller (Nginx locally, HAProxy/Traefik/managed gateway in cloud) behind a cloud Load Balancer that terminates TLS, enforces WAF rules, IP allow/deny lists, and rate limits.
  - Route by host/path (`/api`, `/notifications`, `/`) toward internal ClusterIP services; isolate environments using namespaces (`dev`, `staging`, `prod`) and label selectors.
  - Require multiple replicas per service, readiness/liveness probes, and CPU/memory limits/requests before exposing traffic.
- **Container Registry & CI/CD**
  - Publish images to GHCR/ECR/GCR/ACR using semantic or git-based tags (`api:1.0.3`, `api:sha-abcdef`).
  - CI/CD (GitHub Actions) runs tests, static analysis, image builds, vulnerability scans, and pushes artifacts; deployments flow through GitOps (Argo CD/Flux) or scoped service accounts.
  - Keep rollback options by retaining previous manifests and tags; automate changelog + release notes.
- **Configuration Management**
  - Store shared configuration in ConfigMaps and secrets in Kubernetes Secrets (optionally encrypted with SOPS or SealedSecrets).
  - Use Helm or Kustomize overlays per environment to tweak replicas, domain names, feature flags, and resource settings without touching base manifests.
  - Validate configuration changes with `helm template`, `kustomize build`, or schema validation in CI prior to merging.
- **Networking & Security**
  - Terminate TLS at ingress/load balancer using Cert-Manager for automated issuance/renewal; enforce HTTPS redirects.
  - Apply NetworkPolicies limiting pod-to-pod traffic; only ingress/controller pods can reach services unless explicitly allowed.
  - Implement least-privilege RBAC, unique service accounts per workload, and admission controls (OPA/Gatekeeper) for policy-as-code (e.g., forbid privileged pods, enforce labels).
- **Observability**
  - Expose `/metrics` endpoints in every service instrumented with Prometheus clients; scrape via Prometheus and visualize in Grafana dashboards.
  - Centralize logs with Loki/ELK, include correlation IDs, and ship traces via OpenTelemetry collectors for distributed tracing.
  - Configure alerts on latency, error rates, saturation, pod restarts, and business KPIs; integrate notifications with Slack/Teams/PagerDuty.
- **Scalability & Resilience**
  - Define Horizontal Pod Autoscalers (CPU/custom metrics) and PodDisruptionBudgets to keep capacity during maintenance.
  - Use rolling updates, canary or blue/green deployments, and readiness gates to avoid serving unready pods; keep at least two replicas and distribute across zones when available.
  - Automate backups for stateful components (databases, queues) and practice disaster recovery runbooks.
- **Developer Experience**
  - Provide local dev loops via Tilt/Skaffold/Kind/minikube plus Make/Task runners for common workflows.
  - Manage infrastructure with Terraform (clusters, networks, DNS, load balancers) and document bootstrap steps for new hires.
  - Map feature branches to preview environments; PRs trigger automated checks, image builds, and ephemeral deployments for review before merging.

---

This README evolves with the sandbox—update it as new components, environments, and practices land.

```

```
