node.exe : PASS src/a
uth/auth.service.spec
.ts
At line:1 char:1
+ & "C:\Program Files
\nodejs/node.exe" 
"C:\Program 
Files\nodejs/node_mo 
...
+ ~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~
    + CategoryInfo   
           : NotSpe  
  cified: (PASS sr   
 c/auth/auth.serv    
ice.spec.ts:Stri    
ng) [], RemoteEx    
ception
    + FullyQualified 
   ErrorId : Native  
  CommandError
 
  AuthService
    register
      ΓêÜ should 
successfully 
register a new user 
(28 ms)
      ΓêÜ should 
throw 
ConflictException if 
user already exists 
(60 ms)
    login
      ΓêÜ should 
return tokens for 
valid credentials (8 
ms)
      ΓêÜ should 
throw UnauthorizedExc
eption for invalid 
password (8 ms)

-------------------------------------|---------|----------|---------|---------|---------------------------------------------------------
File                                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                                       
-------------------------------------|---------|----------|---------|---------|---------------------------------------------------------
All files                            |    2.42 |      4.3 |    0.56 |    2.34 |                                                         
 src                                 |       0 |        0 |       0 |       0 |                                                         
  app.controller.ts                  |       0 |      100 |       0 |       0 | 1-20                                                    
  app.module.ts                      |       0 |        0 |       0 |       0 | 25-267                                                  
  app.service.ts                     |       0 |      100 |     100 |       0 | 1-20                                                    
  health.controller.ts               |       0 |        0 |       0 |       0 | 1-217                                                   
  main.ts                            |       0 |        0 |       0 |       0 | 2-229                                                   
 src/addresses                       |       0 |        0 |       0 |       0 |                                                         
  addresses.controller.ts            |       0 |        0 |       0 |       0 | 1-84                                                    
  addresses.module.ts                |       0 |      100 |     100 |       0 | 1-30                                                    
  addresses.service.ts               |       0 |        0 |       0 |       0 | 1-93                                                    
 src/addresses/dto                   |       0 |      100 |     100 |       0 |                                                         
  create-address.dto.ts              |       0 |      100 |     100 |       0 | 1-79                                                    
  update-address.dto.ts              |       0 |      100 |     100 |       0 | 1-20                                                    
 src/admin                           |       0 |        0 |       0 |       0 |                                                         
  admin.module.ts                    |       0 |      100 |     100 |       0 | 1-32                                                    
  bulk.controller.ts                 |       0 |        0 |       0 |       0 | 1-136                                                   
  bulk.service.ts                    |       0 |        0 |       0 |       0 | 1-388                                                   
  security.controller.ts             |       0 |        0 |       0 |       0 | 35-87                                                   
  security.service.ts                |       0 |        0 |       0 |       0 | 32-119                                                  
 src/admin/dto                       |       0 |      100 |     100 |       0 |                                                         
  bulk.dto.ts                        |       0 |      100 |     100 |       0 | 1-98                                                    
 src/agent                           |       0 |        0 |       0 |       0 |                                                         
  agent.controller.ts                |       0 |        0 |       0 |       0 | 21-68                                                   
  agent.module.ts                    |       0 |      100 |     100 |       0 | 1-31                                                    
  agent.service.ts                   |       0 |        0 |       0 |       0 | 21-622                                                  
 src/ai-chat                         |       0 |        0 |       0 |       0 |                                                         
  ai-automation.controller.ts        |       0 |        0 |       0 |       0 | 21-211                                                  
  ai-chat.controller.ts              |       0 |        0 |       0 |       0 | 1-95                                                    
  ai-chat.module.ts                  |       0 |      100 |     100 |       0 | 1-30                                                    
  ai-chat.service.ts                 |       0 |        0 |       0 |       0 | 1-391                                                   
  gemini.service.ts                  |       0 |        0 |       0 |       0 | 1-643                                                   
 src/analytics                       |       0 |        0 |       0 |       0 |                                                         
  analytics.controller.ts            |       0 |        0 |       0 |       0 | 1-130                                                   
  analytics.module.ts                |       0 |      100 |     100 |       0 | 1-27                                                    
  analytics.service.ts               |       0 |        0 |       0 |       0 | 1-402                                                   
 src/audit                           |       0 |        0 |       0 |       0 |                                                         
  audit.controller.ts                |       0 |        0 |       0 |       0 | 1-51                                                    
  audit.interceptor.ts               |       0 |        0 |       0 |       0 | 1-69                                                    
  audit.module.ts                    |       0 |      100 |     100 |       0 | 1-37                                                    
  audit.processor.ts                 |       0 |        0 |       0 |       0 | 1-71                                                    
  audit.service.ts                   |       0 |        0 |       0 |       0 | 1-106                                                   
 src/auth                            |   18.89 |    19.42 |    7.79 |   18.52 |                                                         
  auth.controller.ts                 |       0 |        0 |       0 |       0 | 1-352                                                   
  auth.module.ts                     |       0 |      100 |     100 |       0 | 1-51                                                    
  auth.service.ts                    |   35.68 |    28.46 |   26.08 |   35.92 | 162,179-275,293,297,307,320-321,356-621,645-648,690-717 
  jwt-auth.guard.ts                  |       0 |      100 |     100 |       0 | 1-24                                                    
  jwt.strategy.ts                    |       0 |        0 |       0 |       0 | 1-153                                                   
  optional-jwt-auth.guard.ts         |       0 |        0 |       0 |       0 | 1-27                                                    
  permission.service.ts              |      10 |    35.29 |       0 |    7.54 | 40-284                                                  
  permissions.guard.ts               |       0 |        0 |       0 |       0 | 1-71                                                    
  token.service.ts                   |   21.21 |       24 |       0 |   17.24 | 30-104                                                  
  two-factor.service.ts              |   46.66 |       75 |       0 |   38.46 | 29-82                                                   
 src/auth/decorators                 |       0 |        0 |       0 |       0 |                                                         
  get-user.decorator.ts              |       0 |        0 |       0 |       0 | 1-30                                                    
  permissions.decorator.ts           |       0 |      100 |       0 |       0 | 1-24                                                    
 src/auth/dto                        |       0 |      100 |     100 |       0 |                                                         
  forgot-password.dto.ts             |       0 |      100 |     100 |       0 | 1-30                                                    
  login.dto.ts                       |       0 |      100 |     100 |       0 | 1-37                                                    
  refresh-token.dto.ts               |       0 |      100 |     100 |       0 | 1-28                                                    
  register.dto.ts                    |       0 |      100 |     100 |       0 | 1-53                                                    
  reset-password.dto.ts              |       0 |      100 |     100 |       0 | 1-30                                                    
  update-profile.dto.ts              |       0 |      100 |     100 |       0 | 1-36                                                    
 src/auth/entities                   |   48.64 |    17.64 |       0 |   52.94 |                                                         
  user.entity.ts                     |   48.64 |    17.64 |       0 |   52.94 | 68-71,83-94,103-121                                     
 src/auth/strategies                 |       0 |        0 |       0 |       0 |                                                         
  facebook.strategy.ts               |       0 |        0 |       0 |       0 | 1-54                                                    
  google.strategy.ts                 |       0 |        0 |       0 |       0 | 1-55                                                    
 src/blog                            |       0 |        0 |       0 |       0 |                                                         
  blog.controller.ts                 |       0 |        0 |       0 |       0 | 1-193                                                   
  blog.module.ts                     |       0 |      100 |     100 |       0 | 1-29                                                    
  blog.service.ts                    |       0 |        0 |       0 |       0 | 1-338                                                   
 src/blog/dto                        |       0 |      100 |     100 |       0 |                                                         
  create-blog.dto.ts                 |       0 |      100 |     100 |       0 | 1-71                                                    
  update-blog.dto.ts                 |       0 |      100 |     100 |       0 | 1-18                                                    
 src/brands                          |       0 |        0 |       0 |       0 |                                                         
  brands.controller.ts               |       0 |        0 |       0 |       0 | 1-135                                                   
  brands.module.ts                   |       0 |      100 |     100 |       0 | 1-29                                                    
  brands.service.ts                  |       0 |        0 |       0 |       0 | 1-148                                                   
 src/brands/dto                      |       0 |      100 |     100 |       0 |                                                         
  create-brand.dto.ts                |       0 |      100 |     100 |       0 | 1-26                                                    
  update-brand.dto.ts                |       0 |      100 |     100 |       0 | 1-21                                                    
 src/cart                            |       0 |        0 |       0 |       0 |                                                         
  cart.controller.ts                 |       0 |        0 |       0 |       0 | 27-127                                                  
  cart.module.ts                     |       0 |      100 |     100 |       0 | 1-29                                                    
  cart.service.ts                    |       0 |        0 |       0 |       0 | 1-450                                                   
 src/cart/dto                        |       0 |      100 |     100 |       0 |                                                         
  add-to-cart.dto.ts                 |       0 |      100 |     100 |       0 | 1-28                                                    
  update-cart-item.dto.ts            |       0 |      100 |     100 |       0 | 1-24                                                    
 src/categories                      |       0 |        0 |       0 |       0 |                                                         
  categories.controller.ts           |       0 |        0 |       0 |       0 | 1-135                                                   
  categories.module.ts               |       0 |      100 |     100 |       0 | 1-29                                                    
  categories.service.ts              |       0 |        0 |       0 |       0 | 1-242                                                   
 src/categories/dto                  |       0 |      100 |     100 |       0 |                                                         
  create-category.dto.ts             |       0 |      100 |     100 |       0 | 1-43                                                    
  update-category.dto.ts             |       0 |      100 |     100 |       0 | 1-21                                                    
 src/chat                            |       0 |        0 |       0 |       0 |                                                         
  chat.controller.ts                 |       0 |        0 |       0 |       0 | 2-55                                                    
  chat.gateway.ts                    |       0 |        0 |       0 |       0 | 1-211                                                   
  chat.module.ts                     |       0 |      100 |       0 |       0 | 1-38                                                    
  chat.service.ts                    |       0 |        0 |       0 |       0 | 1-202                                                   
 src/chat/dto                        |       0 |      100 |     100 |       0 |                                                         
  send-message.dto.ts                |       0 |      100 |     100 |       0 | 1-37                                                    
 src/common                          |       0 |        0 |       0 |       0 |                                                         
  base-crud.service.ts               |       0 |        0 |       0 |       0 | 1-177                                                   
  cache-l1.service.ts                |       0 |        0 |       0 |       0 | 1-69                                                    
  common.module.ts                   |       0 |      100 |     100 |       0 | 1-45                                                    
  index.ts                           |       0 |      100 |     100 |       0 | 13-16                                                   
 src/common/email                    |       0 |        0 |       0 |       0 |                                                         
  email.service.ts                   |       0 |        0 |       0 |       0 | 1-51                                                    
 src/common/feature-flags            |       0 |        0 |       0 |       0 |                                                         
  feature-flags-public.controller.ts |       0 |        0 |       0 |       0 | 2-40                                                    
  feature-flags.controller.ts        |       0 |        0 |       0 |       0 | 1-61                                                    
  feature-flags.module.ts            |       0 |      100 |     100 |       0 | 1-24                                                    
  feature-flags.service.ts           |       0 |        0 |       0 |       0 | 24-204                                                  
 src/common/feature-flags/dto        |       0 |      100 |     100 |       0 |                                                         
  feature-flag.dto.ts                |       0 |      100 |     100 |       0 | 1-55                                                    
 src/common/sitemap                  |       0 |        0 |       0 |       0 |                                                         
  sitemap.controller.ts              |       0 |        0 |       0 |       0 | 1-27                                                    
 src/common/utils                    |       0 |        0 |       0 |       0 |                                                         
  fingerprint.ts                     |       0 |        0 |       0 |       0 | 1-36                                                    
 src/core/cache                      |       0 |        0 |       0 |       0 |                                                         
  cache-pubsub.service.ts            |       0 |        0 |       0 |       0 | 25-222                                                  
  cache.service.ts                   |       0 |        0 |       0 |       0 | 1-160                                                   
 src/core/config                     |   57.14 |      100 |       0 |   57.14 |                                                         
  bullmq.config.ts                   |       0 |      100 |       0 |       0 | 1-136                                                   
  constants.ts                       |    92.3 |      100 |       0 |    92.3 | 267                                                     
 src/core/config/throttler           |       0 |        0 |       0 |       0 |                                                         
  redis-throttler.storage.ts         |       0 |        0 |       0 |       0 | 1-76                                                    
 src/core/dataloader                 |       0 |        0 |       0 |       0 |                                                         
  dataloader.module.ts               |       0 |      100 |     100 |       0 | 16-26                                                   
  dataloader.service.ts              |       0 |        0 |       0 |       0 | 29-267                                                  
 src/core/filters                    |       0 |        0 |       0 |       0 |                                                         
  all-exceptions.filter.ts           |       0 |        0 |       0 |       0 | 1-115                                                   
 src/core/guards                     |       0 |        0 |       0 |       0 |                                                         
  app.throttler.guard.ts             |       0 |        0 |       0 |       0 | 1-49                                                    
  csrf.guard.ts                      |       0 |        0 |       0 |       0 | 1-91                                                    
  custom-throttler.guard.ts          |       0 |        0 |       0 |       0 | 1-34                                                    
  lockdown.guard.ts                  |       0 |        0 |       0 |       0 | 18-79                                                   
  super-admin-ip.guard.ts            |       0 |        0 |       0 |       0 | 18-63                                                   
 src/core/interceptors               |       0 |        0 |       0 |       0 |                                                         
  logging.interceptor.ts             |       0 |        0 |       0 |       0 | 1-77                                                    
  transform.interceptor.ts           |       0 |        0 |       0 |       0 | 1-115                                                   
 src/core/logger                     |       0 |        0 |       0 |       0 |                                                         
  logger.service.ts                  |       0 |        0 |       0 |       0 | 1-123                                                   
 src/core/metrics                    |       0 |        0 |       0 |       0 |                                                         
  metrics.module.ts                  |       0 |      100 |     100 |       0 | 14-24                                                   
  metrics.service.ts                 |       0 |        0 |       0 |       0 | 21-262                                                  
 src/core/middlewares                |       0 |        0 |       0 |       0 |                                                         
  correlation-id.middleware.ts       |       0 |        0 |       0 |       0 | 1-68                                                    
 src/core/prisma                     |   15.38 |        0 |       0 |   11.76 |                                                         
  prisma.module.ts                   |       0 |      100 |     100 |       0 | 1-24                                                    
  prisma.service.ts                  |   17.64 |        0 |       0 |    12.9 | 35-97                                                   
 src/core/redis                      |    2.33 |        0 |       0 |    1.49 |                                                         
  enhanced-redis.service.ts          |       0 |        0 |       0 |       0 | 1-231                                                   
  redis.module.ts                    |       0 |      100 |     100 |       0 | 1-26                                                    
  redis.service.ts                   |    4.54 |        0 |       0 |    2.77 | 34-363                                                  
 src/core/security                   |       0 |        0 |       0 |       0 |                                                         
  encryption.service.ts              |       0 |        0 |       0 |       0 | 33-116                                                  
 src/core/sentry                     |       0 |        0 |       0 |       0 |                                                         
  instrument.ts                      |       0 |        0 |       0 |       0 | 30-90                                                   
  sentry.module.ts                   |       0 |      100 |     100 |       0 | 24-42                                                   
 src/core/tenant                     |    9.25 |        0 |       0 |    9.61 |                                                         
  prisma-tenancy.extension.ts        |      20 |        0 |       0 |      20 | 78-150                                                  
  tenant.context.ts                  |       0 |      100 |       0 |       0 | 19-24                                                   
  tenant.middleware.ts               |       0 |        0 |       0 |       0 | 1-91                                                    
 src/core/validation                 |       0 |        0 |       0 |       0 |                                                         
  json-schemas.ts                    |       0 |        0 |       0 |       0 | 1-84                                                    
 src/coupons                         |       0 |        0 |       0 |       0 |                                                         
  coupons.controller.ts              |       0 |        0 |       0 |       0 | 1-128                                                   
  coupons.module.ts                  |       0 |      100 |     100 |       0 | 1-28                                                    
  coupons.service.ts                 |       0 |        0 |       0 |       0 | 1-242                                                   
 src/coupons/dto                     |       0 |        0 |     100 |       0 |                                                         
  create-coupon.dto.ts               |       0 |        0 |     100 |       0 | 1-59                                                    
  update-coupon.dto.ts               |       0 |      100 |     100 |       0 | 1-18                                                    
 src/images                          |       0 |        0 |       0 |       0 |                                                         
  image-processor.controller.ts      |       0 |        0 |       0 |       0 | 21-120                                                  
  image-processor.module.ts          |       0 |      100 |     100 |       0 | 18-41                                                   
  image-processor.service.ts         |       0 |        0 |       0 |       0 | 1-225                                                   
 src/insights                        |       0 |        0 |       0 |       0 |                                                         
  insights.controller.ts             |       0 |        0 |       0 |       0 | 21-70                                                   
  insights.module.ts                 |       0 |      100 |     100 |       0 | 18-42                                                   
  insights.service.ts                |       0 |        0 |       0 |       0 | 1-229                                                   
 src/integrations/cloudinary         |       0 |        0 |       0 |       0 |                                                         
  cloudinary.controller.ts           |       0 |        0 |       0 |       0 | 1-34                                                    
  cloudinary.module.ts               |       0 |      100 |     100 |       0 | 1-32                                                    
  cloudinary.provider.ts             |       0 |      100 |       0 |       0 | 1-27                                                    
  cloudinary.service.ts              |       0 |        0 |       0 |       0 | 1-90                                                    
 src/integrations/email              |   15.78 |       30 |       0 |   11.76 |                                                         
  email.module.ts                    |       0 |      100 |     100 |       0 | 1-23                                                    
  email.service.ts                   |   18.18 |       30 |       0 |    12.9 | 26-140                                                  
 src/integrations/newsletter         |       0 |        0 |       0 |       0 |                                                         
  newsletter.controller.ts           |       0 |        0 |       0 |       0 | 1-32                                                    
  newsletter.module.ts               |       0 |      100 |     100 |       0 | 1-26                                                    
  newsletter.service.ts              |       0 |        0 |       0 |       0 | 1-106                                                   
 src/integrations/newsletter/dto     |       0 |      100 |     100 |       0 |                                                         
  subscribe.dto.ts                   |       0 |      100 |     100 |       0 | 1-27                                                    
 src/integrations/sitemap            |       0 |        0 |       0 |       0 |                                                         
  sitemap.controller.ts              |       0 |        0 |       0 |       0 | 1-26                                                    
  sitemap.module.ts                  |       0 |      100 |     100 |       0 | 1-27                                                    
  sitemap.service.ts                 |       0 |        0 |       0 |       0 | 1-118                                                   
 src/integrations/webhooks           |       0 |        0 |       0 |       0 |                                                         
  webhook.service.ts                 |       0 |        0 |       0 |       0 | 24-254                                                  
 src/newsletter                      |       0 |        0 |       0 |       0 |                                                         
  newsletter.service.ts              |       0 |        0 |       0 |       0 | 1-63                                                    
 src/notifications                   |    8.37 |    14.96 |       0 |    7.07 |                                                         
  notifications.controller.ts        |       0 |        0 |       0 |       0 | 1-262                                                   
  notifications.gateway.ts           |   16.92 |    34.78 |       0 |   14.75 | 52,57-123,138-147,155-208                               
  notifications.module.ts            |       0 |      100 |       0 |       0 | 1-60                                                    
  notifications.service.ts           |   10.29 |    10.34 |       0 |    8.06 | 29-205,216-314                                          
 src/notifications/dto               |       0 |        0 |       0 |       0 |                                                         
  broadcast-notification.dto.ts      |       0 |        0 |     100 |       0 | 1-41                                                    
  create-notification.dto.ts         |       0 |        0 |       0 |       0 | 1-51                                                    
  send-to-user.dto.ts                |       0 |        0 |     100 |       0 | 1-50                                                    
 src/notifications/processors        |       0 |        0 |       0 |       0 |                                                         
  email.processor.ts                 |       0 |        0 |       0 |       0 | 1-56                                                    
 src/orders                          |       0 |        0 |       0 |       0 |                                                         
  invoice.service.ts                 |       0 |        0 |       0 |       0 | 1-118                                                   
  orders.controller.ts               |       0 |        0 |       0 |       0 | 1-161                                                   
  orders.module.ts                   |       0 |      100 |     100 |       0 | 1-49                                                    
  orders.processor.ts                |       0 |        0 |       0 |       0 | 1-201                                                   
  orders.service.ts                  |       0 |        0 |       0 |       0 | 1-1053                                                  
 src/orders/dto                      |       0 |        0 |       0 |       0 |                                                         
  create-order.dto.ts                |       0 |      100 |     100 |       0 | 1-62                                                    
  update-order-status.dto.ts         |       0 |        0 |       0 |       0 | 1-57                                                    
 src/pages                           |       0 |        0 |       0 |       0 |                                                         
  pages.controller.ts                |       0 |        0 |       0 |       0 | 1-103                                                   
  pages.module.ts                    |       0 |      100 |     100 |       0 | 18-27                                                   
  pages.service.ts                   |       0 |        0 |       0 |       0 | 2-206                                                   
 src/payment                         |       0 |        0 |       0 |       0 |                                                         
  payment.controller.ts              |       0 |        0 |       0 |       0 | 1-240                                                   
  payment.module.ts                  |       0 |      100 |     100 |       0 | 1-43                                                    
  payment.service.ts                 |       0 |        0 |       0 |       0 | 1-148                                                   
  payment.webhook.controller.ts      |       0 |        0 |       0 |       0 | 21-46                                                   
  vnpay.utils.ts                     |       0 |        0 |       0 |       0 | 1-56                                                    
 src/payment/dto                     |       0 |      100 |     100 |       0 |                                                         
  webhook-payload.dto.ts             |       0 |      100 |     100 |       0 | 22-56                                                   
 src/payment/strategies              |       0 |        0 |       0 |       0 |                                                         
  cod.strategy.ts                    |       0 |      100 |       0 |       0 | 1-33                                                    
  mock-stripe.strategy.ts            |       0 |      100 |       0 |       0 | 1-40                                                    
  momo.strategy.ts                   |       0 |        0 |       0 |       0 | 1-97                                                    
  vietqr.strategy.ts                 |       0 |        0 |       0 |       0 | 1-47                                                    
  vnpay.strategy.ts                  |       0 |        0 |       0 |       0 | 1-109                                                   
 src/products                        |       0 |        0 |       0 |       0 |                                                         
  products-export.service.ts         |       0 |        0 |       0 |       0 | 1-130                                                   
  products-import.service.ts         |       0 |        0 |       0 |       0 | 1-171                                                   
  products.controller.ts             |       0 |        0 |       0 |       0 | 26-237                                                  
  products.module.ts                 |       0 |      100 |     100 |       0 | 1-48                                                    
  products.service.ts                |       0 |        0 |       0 |       0 | 40-820                                                  
  sku-manager.service.ts             |       0 |        0 |       0 |       0 | 1-331                                                   
 src/products/dto                    |       0 |        0 |       0 |       0 |                                                         
  create-product.dto.ts              |       0 |      100 |       0 |       0 | 1-112                                                   
  filter-product.dto.ts              |       0 |        0 |       0 |       0 | 1-92                                                    
  update-product.dto.ts              |       0 |      100 |       0 |       0 | 1-39                                                    
 src/products/skus                   |       0 |        0 |       0 |       0 |                                                         
  inventory.service.ts               |       0 |        0 |       0 |       0 | 1-136                                                   
 src/rag                             |       0 |        0 |       0 |       0 |                                                         
  knowledge.service.ts               |       0 |        0 |       0 |       0 | 1-222                                                   
  rag.controller.ts                  |       0 |        0 |       0 |       0 | 21-118                                                  
  rag.module.ts                      |       0 |      100 |     100 |       0 | 18-44                                                   
  rag.service.ts                     |       0 |        0 |       0 |       0 | 1-117                                                   
 src/reviews                         |       0 |        0 |       0 |       0 |                                                         
  reviews.controller.ts              |       0 |        0 |       0 |       0 | 1-192                                                   
  reviews.module.ts                  |       0 |      100 |     100 |       0 | 1-31                                                    
  reviews.service.ts                 |       0 |        0 |       0 |       0 | 1-432                                                   
 src/reviews/dto                     |       0 |      100 |     100 |       0 |                                                         
  create-review.dto.ts               |       0 |      100 |     100 |       0 | 1-49                                                    
  update-review.dto.ts               |       0 |      100 |     100 |       0 | 1-17                                                    
 src/roles                           |       0 |        0 |       0 |       0 |                                                         
  roles.controller.ts                |       0 |        0 |       0 |       0 | 1-139                                                   
  roles.module.ts                    |       0 |      100 |     100 |       0 | 1-30                                                    
  roles.service.ts                   |       0 |        0 |       0 |       0 | 1-186                                                   
 src/roles/dto                       |       0 |      100 |     100 |       0 |                                                         
  assign-permissions.dto.ts          |       0 |      100 |     100 |       0 | 1-26                                                    
  create-permission.dto.ts           |       0 |      100 |     100 |       0 | 1-27                                                    
  create-role.dto.ts                 |       0 |      100 |     100 |       0 | 1-24                                                    
  update-permission.dto.ts           |       0 |      100 |     100 |       0 | 1-17                                                    
  update-role.dto.ts                 |       0 |      100 |     100 |       0 | 1-20                                                    
 src/shipping                        |       0 |        0 |       0 |       0 |                                                         
  ghn.service.ts                     |       0 |        0 |       0 |       0 | 1-280                                                   
  shipping.controller.ts             |       0 |        0 |       0 |       0 | 1-65                                                    
  shipping.cron.service.ts           |       0 |        0 |       0 |       0 | 1-121                                                   
  shipping.module.ts                 |       0 |      100 |     100 |       0 | 1-33                                                    
  shipping.service.ts                |       0 |        0 |       0 |       0 | 1-231                                                   
 src/skus                            |       0 |        0 |       0 |       0 |                                                         
  inventory.service.ts               |       0 |        0 |       0 |       0 | 1-181                                                   
  skus.controller.ts                 |       0 |        0 |       0 |       0 | 1-135                                                   
  skus.module.ts                     |       0 |      100 |     100 |       0 | 1-33                                                    
  skus.service.ts                    |       0 |        0 |       0 |       0 | 1-180                                                   
  stock.gateway.ts                   |       0 |        0 |       0 |       0 | 1-79                                                    
 src/skus/dto                        |       0 |      100 |     100 |       0 |                                                         
  create-sku.dto.ts                  |       0 |      100 |     100 |       0 | 1-70                                                    
  update-sku.dto.ts                  |       0 |      100 |     100 |       0 | 1-19                                                    
 src/tenants                         |       0 |        0 |       0 |       0 |                                                         
  plan-usage.service.ts              |       0 |        0 |       0 |       0 | 21-132                                                  
  subscriptions.controller.ts        |       0 |        0 |       0 |       0 | 21-101                                                  
  subscriptions.service.ts           |       0 |        0 |       0 |       0 | 21-160                                                  
  tenants.controller.ts              |       0 |        0 |       0 |       0 | 1-119                                                   
  tenants.module.ts                  |       0 |      100 |     100 |       0 | 18-31                                                   
  tenants.service.ts                 |       0 |        0 |       0 |       0 | 1-129                                                   
 src/tenants/dto                     |       0 |        0 |     100 |       0 |                                                         
  create-tenant.dto.ts               |       0 |        0 |     100 |       0 | 22-62                                                   
  update-tenant.dto.ts               |       0 |      100 |     100 |       0 | 22-25                                                   
 src/users                           |       0 |        0 |       0 |       0 |                                                         
  users.controller.ts                |       0 |        0 |       0 |       0 | 1-126                                                   
  users.module.ts                    |       0 |      100 |     100 |       0 | 1-32                                                    
  users.service.ts                   |       0 |        0 |       0 |       0 | 1-276                                                   
 src/users/dto                       |       0 |      100 |     100 |       0 |                                                         
  assign-roles.dto.ts                |       0 |      100 |     100 |       0 | 1-27                                                    
  create-user.dto.ts                 |       0 |      100 |     100 |       0 | 1-42                                                    
  update-user.dto.ts                 |       0 |      100 |     100 |       0 | 1-21                                                    
 src/wishlist                        |       0 |        0 |       0 |       0 |                                                         
  wishlist.controller.ts             |       0 |        0 |       0 |       0 | 1-104                                                   
  wishlist.module.ts                 |       0 |      100 |     100 |       0 | 1-28                                                    
  wishlist.service.ts                |       0 |        0 |       0 |       0 | 1-176                                                   
 src/worker                          |       0 |        0 |       0 |       0 |                                                         
  worker.module.ts                   |       0 |        0 |       0 |       0 | 1-91                                                    
 src/worker/processors               |       0 |        0 |       0 |       0 |                                                         
  cache-warming.processor.ts         |       0 |        0 |       0 |       0 | 1-94                                                    
  outbox.processor.ts                |       0 |        0 |       0 |       0 | 1-107                                                   
-------------------------------------|---------|----------|---------|---------|---------------------------------------------------------
Test Suites: 1 
passed, 1 total
Tests:       4 
passed, 4 total
Snapshots:   0 total
Time:        22.129 s
Ran all test suites 
matching src/auth/aut
h.service.spec.ts.
