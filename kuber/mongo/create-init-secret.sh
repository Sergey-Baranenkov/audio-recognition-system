kubectl delete secret diploma-mongo-initial --ignore-not-found
kubectl create secret generic diploma-mongo-initial --from-file='initial-script.js'
