kubectl delete secret diploma-nodejs-server-env --ignore-not-found
kubectl create secret generic diploma-nodejs-server-env --from-env-file='.env'
