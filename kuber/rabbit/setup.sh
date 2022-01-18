helm repo add bitnami https://charts.bitnami.com/bitnami

sh ./create-definitions-secret.sh

helm install diploma-rabbit bitnami/rabbitmq --values values.yml
