kubectl delete secret diploma-mongo-job-env --ignore-not-found
kubectl create secret generic diploma-mongo-job-env --from-env-file='.env'
