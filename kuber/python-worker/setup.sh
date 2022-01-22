sh ./create-env-secret.sh

helm install --values ./helm/values.yaml diploma-python-worker ./helm
