SHELL := /usr/bin/env bash
.SHELLFLAGS := -eo pipefail -c

.PHONY: build build-api build-notifications load-images apply-app apply-gateway apply-monitoring set-images up smoke-test smoke-test-cluster push push-api push-notifications check-registry

K8S_NAMESPACE := sandbox-app
REGISTRY ?=
IMAGE_TAG ?= v1
API_IMAGE_NAME ?= api-service
NOTIFICATIONS_IMAGE_NAME ?= notifications-service
IMAGE_PREFIX := $(if $(strip $(REGISTRY)),$(REGISTRY)/,)
API_IMAGE := $(IMAGE_PREFIX)$(API_IMAGE_NAME):$(IMAGE_TAG)
NOTIFICATIONS_IMAGE := $(IMAGE_PREFIX)$(NOTIFICATIONS_IMAGE_NAME):$(IMAGE_TAG)
IMAGES := $(API_IMAGE) $(NOTIFICATIONS_IMAGE)
HOST_IP ?= 127.0.0.1

build-api:
	docker build -t $(API_IMAGE) services/api

build-notifications:
	docker build -t $(NOTIFICATIONS_IMAGE) services/notifications

build: build-api build-notifications

load-images: build
	minikube image load $(API_IMAGE)
	minikube image load $(NOTIFICATIONS_IMAGE)

apply-app:
	kubectl apply -f infra/k8s/namespace.yaml
	kubectl apply -f services/api/k8s/deployment.yaml
	kubectl apply -f services/api/k8s/service.yaml
	kubectl apply -f services/notifications/k8s/deployment.yaml
	kubectl apply -f services/notifications/k8s/service.yaml

apply-gateway:
	kubectl apply -f infra/k8s/gatewayclass.yaml
	kubectl apply -f infra/k8s/gateway.yaml
	kubectl apply -f infra/k8s/api-route.yaml
	kubectl apply -f infra/k8s/notifications-route.yaml
	kubectl apply -f infra/k8s/contour-config.yaml

apply-monitoring:
	kubectl apply -f infra/k8s/prometheus.yaml
	kubectl apply -f infra/k8s/grafana.yaml

set-images:
	kubectl set image deployment/api api=$(API_IMAGE) -n $(K8S_NAMESPACE)
	kubectl set image deployment/notifications notifications=$(NOTIFICATIONS_IMAGE) -n $(K8S_NAMESPACE)

up: load-images apply-app apply-gateway apply-monitoring set-images
	kubectl rollout status deployment/api -n $(K8S_NAMESPACE)
	kubectl rollout status deployment/notifications -n $(K8S_NAMESPACE)
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

push: check-registry build push-api push-notifications

smoke-test:
	curl -H "Host: sandbox.local" http://$(HOST_IP)/health
	curl -H "Host: sandbox.local" http://$(HOST_IP)/stats
	curl -H "Host: notify.sandbox.local" http://$(HOST_IP)/healthz
	curl -H "Host: notify.sandbox.local" http://$(HOST_IP)/stats
	curl -H "Host: notify.sandbox.local" http://$(HOST_IP)/send \
		-X POST -H "Content-Type: application/json" \
		-d '{"channel":"email","recipient":"dev@example.com","message":"hello from make smoke-test"}'

smoke-test-cluster:
	kubectl run curl-test --rm -i --tty --image=curlimages/curl --restart=Never -- \
		curl -s -H "Host: sandbox.local" http://envoy.projectcontour.svc.cluster.local/health
	kubectl run notify-test --rm -i --tty --image=curlimages/curl --restart=Never -- \
		curl -s -H "Host: notify.sandbox.local" http://envoy.projectcontour.svc.cluster.local/healthz
