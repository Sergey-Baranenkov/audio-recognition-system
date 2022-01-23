helm repo add bitnami https://charts.bitnami.com/bitnami
helm install diploma-mongo bitnami/mongodb-sharded --values values.yml
