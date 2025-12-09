pipeline {
  agent any

  options {
    timestamps()
    ansiColor('xterm')
  }

  parameters {
    string(name: 'REGISTRY_PREFIX', defaultValue: 'ghcr.io/your-gh-username', description: 'Container registry namespace to push images to (e.g., ghcr.io/your-gh-username).')
    string(name: 'IMAGE_TAG', defaultValue: '', description: 'Optional image tag override. Leave empty to default to the current commit SHA.')
    booleanParam(name: 'DEPLOY_TO_CLUSTER', defaultValue: false, description: 'If true, apply Kubernetes manifests using the kubeconfig Jenkins credential.')
  }

  environment {
    // Placeholder for the make arguments once they are computed in the init stage
    MAKE_ARGS = ''
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Initialize Build Metadata') {
      steps {
        script {
          if (!params.REGISTRY_PREFIX?.trim()) {
            error('REGISTRY_PREFIX is required (example: ghcr.io/your-gh-username).')
          }

          def registryPrefix = params.REGISTRY_PREFIX.trim()
          def pathSegments = registryPrefix.tokenize('/')
          if (pathSegments.size() < 2) {
            error("REGISTRY_PREFIX must include both a registry host and a namespace (example: ghcr.io/your-gh-username). Provided value: ${registryPrefix}")
          }

          def computedTag = params.IMAGE_TAG?.trim()
          if (!computedTag) {
            computedTag = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
          }

          env.CI_REGISTRY_PREFIX = registryPrefix
          env.CI_IMAGE_TAG = computedTag
          env.CI_REGISTRY_HOST = pathSegments.first()
          env.MAKE_ARGS = "REGISTRY=${registryPrefix} IMAGE_TAG=${computedTag}"

          echo "Images will be tagged as ${registryPrefix}/(api-service|notifications-service):${computedTag}"
        }
      }
    }

    stage('Lint & Tests') {
      steps {
        sh '''
          set -euo pipefail
          docker run --rm \
            -v "$PWD":/workspace \
            -w /workspace \
            python:3.12-slim \
            bash -c "set -euo pipefail; pip install --no-cache-dir -r services/api/requirements.txt -r services/notifications/requirements.txt; python -m compileall services/api services/notifications"
        '''
      }
    }

    stage('Build Images') {
      steps {
        sh "make build ${env.MAKE_ARGS}"
      }
    }

    stage('Push Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'sandbox-registry-creds', usernameVariable: 'REGISTRY_USER', passwordVariable: 'REGISTRY_TOKEN')]) {
          sh '''
            set -euo pipefail
            echo "Logging into ${CI_REGISTRY_HOST}"
            echo "$REGISTRY_TOKEN" | docker login ${CI_REGISTRY_HOST} -u "$REGISTRY_USER" --password-stdin
            make push-api ${MAKE_ARGS}
            make push-notifications ${MAKE_ARGS}
          '''
        }
      }
    }

    stage('Deploy to Cluster') {
      when {
        expression { return params.DEPLOY_TO_CLUSTER }
      }
      steps {
        withCredentials([file(credentialsId: 'sandbox-kubeconfig', variable: 'KUBECONFIG_FILE')]) {
          sh '''
            set -euo pipefail
            export KUBECONFIG="$KUBECONFIG_FILE"
            make apply-app ${MAKE_ARGS}
            make apply-gateway
            make apply-monitoring
            make set-images ${MAKE_ARGS}
            kubectl rollout status deployment/api -n sandbox-app --timeout=120s
            kubectl rollout status deployment/notifications -n sandbox-app --timeout=120s
          '''
        }
      }
    }
  }

  post {
    always {
      script {
        if (env.CI_REGISTRY_HOST) {
          sh script: "docker logout ${env.CI_REGISTRY_HOST} || true", label: 'docker logout'
        }
      }
    }
  }
}
