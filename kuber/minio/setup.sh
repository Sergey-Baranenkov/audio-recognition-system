helm repo add minio https://charts.min.io/
helm install diploma-minio minio/minio --values values.yml
