SHELL := /usr/bin/env bash
.SHELLFLAGS := -eo pipefail -c

.PHONY: build build-api build-notifications build-frontend build-gateway build-locations load-images apply-app apply-gateway apply-monitoring set-images up smoke-test smoke-test-cluster push push-api push-notifications push-frontend push-gateway push-locations check-registry

K8S_NAMESPACE := sandbox-app
REGISTRY ?=
IMAGE_TAG ?= v1
API_IMAGE_NAME ?= api-service
NOTIFICATIONS_IMAGE_NAME ?= notifications-service
FRONTEND_IMAGE_NAME ?= frontend-service
GATEWAY_IMAGE_NAME ?= gateway-service
LOCATIONS_IMAGE_NAME ?= locations-service
IMAGE_PREFIX := $(if $(strip $(REGISTRY)),$(REGISTRY)/,)
API_IMAGE := $(IMAGE_PREFIX)$(API_IMAGE_NAME):$(IMAGE_TAG)
NOTIFICATIONS_IMAGE := $(IMAGE_PREFIX)$(NOTIFICATIONS_IMAGE_NAME):$(IMAGE_TAG)
FRONTEND_IMAGE := $(IMAGE_PREFIX)$(FRONTEND_IMAGE_NAME):$(IMAGE_TAG)
GATEWAY_IMAGE := $(IMAGE_PREFIX)$(GATEWAY_IMAGE_NAME):$(IMAGE_TAG)
LOCATIONS_IMAGE := $(IMAGE_PREFIX)$(LOCATIONS_IMAGE_NAME):$(IMAGE_TAG)
IMAGES := $(API_IMAGE) $(NOTIFICATIONS_IMAGE) $(FRONTEND_IMAGE) $(GATEWAY_IMAGE) $(LOCATIONS_IMAGE)
HOST_IP ?= 127.0.0.1
FRONTEND_SECRET_FILE ?= infra/k8s/secrets/frontend-secrets.local.yaml
DB_SECRET_FILE ?= infra/k8s/secrets/db-secrets.local.yaml

ifeq ($(wildcard $(FRONTEND_SECRET_FILE)),)
FRONTEND_SECRET_APPLY := @echo "Skipping frontend secrets (missing $(FRONTEND_SECRET_FILE))"
else
FRONTEND_SECRET_APPLY := kubectl apply -f $(FRONTEND_SECRET_FILE)
endif

ifeq ($(wildcard $(DB_SECRET_FILE)),)
DB_SECRET_APPLY := @echo "Skipping database secrets (missing $(DB_SECRET_FILE))"
else
DB_SECRET_APPLY := kubectl apply -f $(DB_SECRET_FILE)
endif

build-api:
	docker build -t $(API_IMAGE) services/api

build-notifications:
	docker build -t $(NOTIFICATIONS_IMAGE) services/notifications

build-frontend:
	docker build -t $(FRONTEND_IMAGE) services/frontend

build-gateway:
	docker build -t $(GATEWAY_IMAGE) services/gateway

build-locations:
	docker build -t $(LOCATIONS_IMAGE) services/locations

build: build-api build-notifications build-frontend build-gateway build-locations

load-images: build
	minikube image load $(API_IMAGE)
	minikube image load $(NOTIFICATIONS_IMAGE)
	minikube image load $(FRONTEND_IMAGE)
	minikube image load $(GATEWAY_IMAGE)
	minikube image load $(LOCATIONS_IMAGE)

apply-app:
	kubectl apply -f infra/k8s/namespace.yaml
	$(FRONTEND_SECRET_APPLY)
	$(DB_SECRET_APPLY)
	kubectl apply -f services/api/k8s/deployment.yaml
	kubectl apply -f services/api/k8s/service.yaml
	kubectl apply -f services/notifications/k8s/deployment.yaml
	kubectl apply -f services/notifications/k8s/service.yaml
	kubectl apply -f infra/k8s/db/postgres.yaml
	kubectl apply -f infra/k8s/db/redis.yaml
	kubectl apply -f services/frontend/k8s/deployment.yaml
	kubectl apply -f services/frontend/k8s/service.yaml
	kubectl apply -f services/gateway/k8s/deployment.yaml
	kubectl apply -f services/gateway/k8s/service.yaml
	kubectl apply -f services/locations/k8s/deployment.yaml
	kubectl apply -f services/locations/k8s/service.yaml

apply-gateway:
	kubectl apply -f infra/k8s/gatewayclass.yaml
	kubectl apply -f infra/k8s/gateway.yaml
	kubectl apply -f infra/k8s/api-route.yaml
	kubectl apply -f infra/k8s/notifications-route.yaml
	kubectl apply -f infra/k8s/frontend-route.yaml
	kubectl apply -f infra/k8s/gateway-service-route.yaml
	kubectl apply -f infra/k8s/contour-config.yaml

apply-monitoring:
	kubectl apply -f infra/k8s/prometheus.yaml
	kubectl apply -f infra/k8s/grafana.yaml

set-images:
	kubectl set image deployment/api api=$(API_IMAGE) -n $(K8S_NAMESPACE)
	kubectl set image deployment/notifications notifications=$(NOTIFICATIONS_IMAGE) -n $(K8S_NAMESPACE)
	kubectl set image deployment/frontend frontend=$(FRONTEND_IMAGE) -n $(K8S_NAMESPACE)
	kubectl set image deployment/gateway-service gateway-service=$(GATEWAY_IMAGE) -n $(K8S_NAMESPACE)
	kubectl set image deployment/locations locations=$(LOCATIONS_IMAGE) -n $(K8S_NAMESPACE)

up: load-images apply-app apply-gateway apply-monitoring set-images
	kubectl rollout status deployment/api -n $(K8S_NAMESPACE)
	kubectl rollout status deployment/notifications -n $(K8S_NAMESPACE)
	kubectl rollout status deployment/frontend -n $(K8S_NAMESPACE)
	kubectl rollout status deployment/gateway-service -n $(K8S_NAMESPACE)
	kubectl rollout status deployment/locations -n $(K8S_NAMESPACE)
	kubectl rollout status deployment/prometheus-server -n $(K8S_NAMESPACE)
	kubectl rollout status deployment/grafana -n $(K8S_NAMESPACE)
	kubectl rollout status deployment/contour -n projectcontour

check-registry:
	@if [ -z "$(strip $(REGISTRY))" ]; then \
		echo "REGISTRY is required for push targets (e.g. docker.io/you or ghcr.io/you)"; \
		exit 1; \
	fi

push-api:
	docker push $(API_IMAGE)

push-notifications:
	docker push $(NOTIFICATIONS_IMAGE)

push-frontend:
	docker push $(FRONTEND_IMAGE)

push-gateway:
	docker push $(GATEWAY_IMAGE)

push-locations:
	docker push $(LOCATIONS_IMAGE)

push: check-registry build push-api push-notifications push-frontend push-gateway push-locations

smoke-test:
	curl -H "Host: sandbox.local" http://$(HOST_IP)/health
	curl -H "Host: sandbox.local" http://$(HOST_IP)/stats
	curl -H "Host: notify.sandbox.local" http://$(HOST_IP)/healthz
	curl -H "Host: notify.sandbox.local" http://$(HOST_IP)/stats
	curl -H "Host: notify.sandbox.local" http://$(HOST_IP)/send \
		-X POST -H "Content-Type: application/json" \
		-d '{"channel":"email","recipient":"dev@example.com","message":"hello from make smoke-test"}'
	curl -H "Host: ui.sandbox.local" http://$(HOST_IP)/
	curl -H "Host: api.photo.local" http://$(HOST_IP)/healthz
	curl -H "Host: api.photo.local" http://$(HOST_IP)/locations

smoke-test-cluster:
	kubectl run curl-test --rm -i --tty --image=curlimages/curl --restart=Never -- \
		curl -s -H "Host: sandbox.local" http://envoy.projectcontour.svc.cluster.local/health
	kubectl run notify-test --rm -i --tty --image=curlimages/curl --restart=Never -- \
		curl -s -H "Host: notify.sandbox.local" http://envoy.projectcontour.svc.cluster.local/healthz
	kubectl run ui-test --rm -i --tty --image=curlimages/curl --restart=Never -- \
		curl -s -H "Host: ui.sandbox.local" http://envoy.projectcontour.svc.cluster.local/
	kubectl run photo-api-test --rm -i --tty --image=curlimages/curl --restart=Never -- \
		curl -s -H "Host: api.photo.local" http://envoy.projectcontour.svc.cluster.local/healthz
	kubectl run locations-test --rm -i --tty --image=curlimages/curl --restart=Never -- \
		curl -s -H "Host: api.photo.local" http://envoy.projectcontour.svc.cluster.local/locations
