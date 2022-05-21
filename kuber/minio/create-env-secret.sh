kubectl delete secret diploma-minio-cronjob-env --ignore-not-found
kubectl create secret generic diploma-minio-cronjob-env --from-env-file='.env'
