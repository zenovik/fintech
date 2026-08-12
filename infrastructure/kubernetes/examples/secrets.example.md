# Secret template — DO NOT commit real values.
# Create secrets before deploy:
#
#   kubectl create namespace production
#   kubectl create secret generic fintech-app-secrets \
#     --namespace=production \
#     --from-literal=JWT_SECRET='...' \
#     --from-literal=JWT_REFRESH_SECRET='...' \
#     --from-literal=CONFIG_ENCRYPTION_KEY='...' \
#     --from-literal=DB_PASSWORD='...' \
#     --from-literal=MYSQL_ROOT_PASSWORD='...' \
#     --from-literal=MYSQL_PASSWORD='...' \
#     --from-literal=REDIS_PASSWORD='...' \
#     --from-literal=REDIS_URL='redis://:password@redis:6379' \
#     --from-literal=SMTP_HOST='...' \
#     --from-literal=SMTP_USER='...' \
#     --from-literal=SMTP_PASSWORD='...' \
#     --from-literal=STRIPE_SECRET_KEY='...' \
#     --from-literal=STRIPE_WEBHOOK_SECRET='...' \
#     --from-literal=RAZORPAY_KEY_ID='...' \
#     --from-literal=RAZORPAY_KEY_SECRET='...' \
#     --from-literal=RAZORPAY_WEBHOOK_SECRET='...'
#
#   kubectl create secret generic fintech-redis-secret \
#     --namespace=production \
#     --from-literal=REDIS_PASSWORD='...'
