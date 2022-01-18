helm repo add bitnami https://charts.bitnami.com/bitnami
helm install diploma-redis bitnami/redis-cluster --values values.yml
