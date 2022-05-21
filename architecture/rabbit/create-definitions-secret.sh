kubectl delete secret diploma-rabbit-definitions --ignore-not-found
kubectl create secret generic diploma-rabbit-definitions --from-file=load_definition.json
