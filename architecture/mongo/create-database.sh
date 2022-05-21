sh ./create-init-secret.sh
sh ./create-env-secret.sh
kubectl apply -f ./initial-script-job.yaml
