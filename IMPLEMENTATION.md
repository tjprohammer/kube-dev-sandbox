# photo.tjprohammer.us – Kubernetes Travel Photo Map

A map-based travel photography platform that showcases all the places you’ve visited, with your own images and AI-generated descriptions — rebuilt as a **multi-service, Kubernetes-native application**.

This project takes the existing [`photo.tjprohammer.us`](https://photo.tjprohammer.us) concept and evolves it into a real-world app for learning:

- Kubernetes (Deployments, Services, Ingress/Gateway, CronJobs, StatefulSets)
- Service-oriented architecture
- Observability and external API integration

---

## Table of Contents

- [Goals](#goals)
- [Core Concept](#core-concept)
- [Features](#features)
  - [Current](#current)
  - [Planned](#planned)
- [High-Level Architecture](#high-level-architecture)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
  - [1. Fork & Clone](#1-fork--clone)
  - [2. Local Development](#2-local-development)
  - [3. Kubernetes Development](#3-kubernetes-development)
- [Configuration & Secrets](#configuration--secrets)
- [Roadmap](#roadmap)
- [License](#license)

---

## Goals

- Use a **real personal project** (your travel photo map) as the backbone for learning Kubernetes.
- Break a “single app” into **multiple focused services**.
- Run the full system inside a local or remote Kubernetes cluster (kind, Minikube, or managed K8s).
- Practice:
  - Stateless vs stateful workloads
  - Background processing via CronJobs
  - External API integration (LLM, weather, sun position)
  - Observability (metrics, dashboards)

---

## Core Concept

The application centers around a **world map** of pins representing places you’ve visited:

- Each pin:
  - Shows photos you took at that location.
  - Includes an AI-generated description of the place.
- The app will grow into a **travel stories + photo planning platform**, useful both as:
  - A public portfolio of your travels.
  - A personal tool for planning future shoots.

There is **no checkout/e-commerce** flow at the moment; the focus is on mapping, content, and planning.

---

## Features

### Current

- Interactive map with pins for visited locations.
- Per-pin photo gallery.
- AI-generated descriptions for each location (stored and displayed in the UI).

### Planned

These features are the basis for the Kubernetes-oriented architecture and roadmap:

#### 1. Travel Stories & Guides

- Group pins into **Trips** (e.g., “Fall 2024 Colorado Roadtrip”) and **Themes** (e.g., “High Alpine Lakes”).
- Per-Trip pages with:
  - Narrative travel story (generated via AI from your notes + pins).
  - “If you go here…” sections (best season, difficulty, nearby spots).
- Public, shareable URLs for trips.

#### 2. Photo Planner

- Per-pin information about:
  - Best season and time of day to shoot.
  - Weather and light conditions (via external APIs).
- “Plan this spot”:
  - User chooses a date; the app suggests shooting windows.
- Multi-pin itineraries:
  - 1–3 day photo plans that combine several pins.

#### 3. Background Jobs

- CronJobs for:
  - Pre-fetching weather/light conditions for popular pins.
  - Periodically refreshing AI stories for trips and locations (optional).

#### 4. Optional Future Ideas

- **Print / Commission Requests**  
  Simple form-based flow so visitors can request prints or custom shoots (no full checkout).
- **Private Pin Vault & Sharing**  
  Private pins visible only when logged in, collections of scouting locations, and shareable private links.

---

## High-Level Architecture

The project is designed as multiple services running in Kubernetes.

### Services

- `frontend-web`
  - React (or other) SPA that renders the map, galleries, and pages.
  - Communicates exclusively with backend APIs.
  - Exposed via Ingress or Gateway.

- `locations-service`
  - CRUD for pins/locations:
    - Coordinates, titles, tags, regions
    - Links to photo assets (e.g., S3)
    - Stored metadata and AI descriptions
  - Backed by Postgres (optionally PostGIS for geo queries).

- `trips-service`
  - Manages Trips and Themes:
    - Definitions of trips (ordered lists of locations).
    - Trip metadata (duration, difficulty, seasonality).
  - Calls `ai-writer-service` to generate or update stories.

- `ai-writer-service`
  - Wraps a Large Language Model provider (e.g., OpenAI) to:
    - Generate location descriptions.
    - Generate trip narratives and “If you go…” guidance.
  - Stateless service with rate limiting and metrics.

- `conditions-service`
  - Integrates with external APIs:
    - Weather (current + forecast).
    - Sun/sunrise/sunset, golden hour times.
  - Provides `/conditions?lat=…&lng=…&date=…`.
  - Caches responses in Redis.

- `planner-service`
  - Uses `locations-service` + `conditions-service` to:
    - Determine “best time to shoot” for a given date/location.
    - Create simple 1–3 day itineraries.
  - Consumed by the frontend.

- `jobs/cache-warmer` (CronJob)
  - Pre-fetches conditions for popular pins and/or upcoming trips.
  - Can also trigger periodic AI updates for stories (optional).

### Shared Infrastructure

- **Postgres**
  - StatefulSet with PersistentVolumeClaim.
  - Stores:
    - Locations
    - Trips
    - (Optionally) requests, users, or other structured data.

- **Redis**
  - Used mainly for caching:
    - Weather/sun API responses.
    - Frequently requested planner/trip data.

- **Ingress / Gateway**
  - Typical routing example:
    - `https://photo.local/` → `frontend-web`
    - `https://api.photo.local/locations` → `locations-service`
    - `https://api.photo.local/trips` → `trips-service`
    - `https://api.photo.local/planner` → `planner-service`

- **Observability**
  - Prometheus scrapes all services.
  - Grafana dashboards for:
    - Request volume per service
    - Latency and error rates
    - External API call failures (LLM, weather, sun APIs)

---

## Tech Stack

- **Frontend**
  - React (Mapbox for maps, existing UI from `photo.tjprohammer.us`)

- **Backend Services**
  - Language and frameworks are flexible (e.g., Go, Node.js, or Python).  
    Choice can be made per service, as long as they expose HTTP APIs.

- **Datastores**
  - Postgres (possibly with PostGIS)
  - Redis for caching

- **Infrastructure**
  - Kubernetes (kind, Minikube, or managed K8s)
  - Docker for local container builds
  - Prometheus + Grafana for metrics and dashboards

---

## Repository Layout

Target layout (this will evolve as the project is implemented):

```text
photo.tjprohammer.us/
├── apps/
│   ├── frontend-web/          # Map-based UI (React, Mapbox)
│   ├── locations-service/     # Pins/locations API
│   ├── trips-service/         # Trips, themes, guides
│   ├── ai-writer-service/     # AI narrative generation
│   ├── conditions-service/    # Weather + sun integration
│   └── planner-service/       # Photo planning logic
│
├── infra/
│   ├── k8s/
│   │   ├── base/              # Namespaces, RBAC, shared resources
│   │   ├── apps/              # Deployments, Services for each app
│   │   ├── db/                # Postgres, Redis StatefulSets
│   │   └── ingress/           # Ingress/Gateway definitions
│   └── helm/                  # (Optional) Helm charts
│
├── docs/
│   └── architecture.md        # Detailed architecture and decisions
│
└── README.md                  # This file


Repo strategy

Decide whether to migrate the existing tjprohammer-us code into this sandbox (easiest: move the current frontend into services/frontend-web and start stubbing the new services beside it) or keep a separate repo but share manifests/pipeline logic. Given kube-dev-sandbox already has Makefile + workflow + manifests, pulling your map code into it seems cleaner.
First milestones

Import the current frontend as services/frontend-web and wire its Dockerfile/k8s manifests. Extend make build and the workflow to build/push it along with api/notifications.
Stub locations-service (the API your site needs right now). Port existing backend logic or create a new FastAPI/Express service with endpoints for pins. Deploy it in-cluster and point the frontend at it.
Add Postgres (StatefulSet + PVC) in infra/k8s/db/ and update locations-service to persist there.
Iterate toward the plan

Add trips-service, ai-writer-service, conditions-service, etc., as you introduce features (trip guides, weather data, AI narratives). Each service gets its own directory under services, Dockerfile, and k8s manifests. Update Makefile + CI to build/push them.
Introduce the CronJob (jobs/cache-warmer) once you have conditions or AI refresh logic.
Layer in Redis, secrets management, observability dashboards, and network policies as called out in IMPLEMENTATION.md.
CI/CD alignment

The current GitHub Actions workflow already lint/build/pushes. As you add apps, keep the Makefile the central source (e.g., make build builds all services; make deploy-service=frontend-web). Later, add environment-specific deploy jobs or GitOps.
Documentation

Promote IMPLEMENTATION.md content into docs/architecture.md inside this repo so contributors (future you) can follow the roadmap. Keep README.md high-level and point to docs for details.

A few guiding thoughts so it stays manageable:

Incremental carve-out: don’t rewrite everything at once. Start by porting the existing frontend into services/frontend-web as-is, deploy it in Kubernetes, and keep its APIs pointing to the current Lambda endpoints. That gives you a baseline “frontend running in-cluster” while you design replacements for the Lambdas.

Shim layer/API gateway: add a thin api-gateway service (FastAPI/Express) that proxies to your Lambdas initially. As you build the new locations-service, trips-service, etc., move endpoints from Lambda into these services and keep the same REST contract so the frontend barely changes.

Module-by-module migration: pick a feature (e.g., pin CRUD). Re-implement that Lambda as locations-service, update the frontend to call the new internal API, and retire the Lambda. Repeat for trips, planner, AI writer.

Frontend reorg only when needed: once you have multiple backend services, decide how much of the frontend needs restructuring. Often you can keep the UI largely intact but refactor its data layer (hooks/services) to talk to the new endpoints. If a major redesign is coming anyway (new planner screens, trip pages), do that work in parallel.

Codify contracts: as you move logic off Lambda, define OpenAPI specs or TypeScript types for each service. That makes it easier to share SDKs between the frontend and future mobile clients.

Leverage existing code: even if Lambda handlers need rework, you can often lift their core logic into the new services. Wrap it in a proper service, add tests, and you avoid rewriting the business rules.