sh ./create-env-secret.sh

helm install --values ./helm/values.yaml diploma-nodejs-server ./helm
