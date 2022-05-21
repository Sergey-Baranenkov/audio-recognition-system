kubectl delete secret diploma-python-worker-env --ignore-not-found
kubectl create secret generic diploma-python-worker-env --from-env-file='.env'
