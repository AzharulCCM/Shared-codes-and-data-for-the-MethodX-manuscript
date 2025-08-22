install.packages("here")
install.packages( "readr")
install.packages("janitor")
install.packages("mgcv", dependencies = TRUE )
install.packages("nlme",  dependencies = TRUE)
install.packages("gratia")
install.packages("dplyr")
install.packages("ggplot2")
install.packages("ggrepel")
install.packages("countreg", dependencies = TRUE, repos="http://R-Forge.R-project.org")
install.packages("DHARMa")
install.packages("car")


library(here)
library(readr)
library(janitor)
library(mgcv)
library(nlme)
library(gratia)
library(dplyr)
library(ggplot2)
library(ggrepel)
library(countreg)
library(DHARMa)
library(gratia)
library(patchwork)
library(car)
library(ggplot2)
library(spdep)

### Working directory set and data reading
setwd("C:\\Users\\Azharul Islam\\Desktop\\MethodX\\GAM")
Modeldata<-read.csv("GAM model data.csv")
Modeldata

###### Multicollinearity check via VIF diagnostic
vif_model <- lm(PMDF ~ GP + ST + Precipitation + WP + PopD + Long + Lat, data = Modeldata)
vif_values <- vif(vif_model)
vif_values



######### Model ###############

######### GAM model (Model 0)
GAM_PM10_deposition_flux<- gam(PMDF ~ 
                                 s(GP) +                  
                                 s(ST) + 
                                 s(Precipitation) + 
                                 s(WP) + 
                                 s(PopD) + 
                                 s(Long, Lat,k=2),         
                               data = Modeldata,
                               family = scat(),
                               method = "REML")
summary(GAM_PM10_deposition_flux)
AIC(GAM_PM10_deposition_flux)



#########Spatial Auto correlation

coords <- cbind(Modeldata$Long, Modeldata$Lat)
##### Optional: jitter identical coordinates slightly
coords_jittered <- jitter(coords, amount = 1e-4)
##### Create neighbor structure 
nb <- knn2nb(knearneigh(coords_jittered, k = 4))

#### Converting to spatial weights
lw <- nb2listw(nb)
#### Extract residuals from GAM
resids <- residuals(GAM_PM10_deposition_flux)
##### Moran’s I test
moran_result <- moran.test(resids, lw)
print(moran_result)



##### GAM Model (Model 1)

GAM_PM10_deposition_flux_1 <- gam(PMDF ~ 
                                    s(GP) +                  
                                    s(Precipitation) + 
                                    s(WP, k= 3) + 
                                    s(PopD) + 
                                    s(Long, Lat,k=2),         
                                  data = Modeldata,
                                  family = scat(),
                                  method = "REML")
summary(GAM_PM10_deposition_flux_1)
AIC(GAM_PM10_deposition_flux_1)



##### GAM Model (Model 2)

GAM_PM10_deposition_flux_2 <- gam(PMDF ~ 
                                    s(GP, k = 4) +                  
                                    s(ST) + 
                                    s(Precipitation) + 
                                    s(WP) + 
                                    s(Long, Lat,k=2),         
                                  data = Modeldata,
                                  family = scat(),
                                  method = "REML")
summary(GAM_PM10_deposition_flux_2)
AIC(GAM_PM10_deposition_flux_2)



##################################
################################## Effect of greenspace percentage visualaization

plot(GAM_PM10_deposition_flux_2, all.terms = TRUE, se = TRUE, scheme = 1, shade = TRUE, shade.col = "hot pink", lwd = 1,
     ylab = "Effect on PM10 deposition flux (μg/m²/hr)", ylim = c(-0.070, 0.07), 
     cex.axis= 1, cex.lab=1.1,font.axis = 2,font.lab  = 2, select = 1, xlab="Greenspace (%)")

abline(h = 0, col = "black", lty = 2, lwd = 2)



################################
## GAM model check with residuals from the best model
GAM_residual_check <- appraise(GAM_PM10_deposition_flux_2, method = "simulate")
GAM_residual_check

#### Increase the fron sizes for better visualaization
GAM_residual_check <- lapply(GAM_residual_check, function(p) {
  p + theme(
    plot.title = element_text(size = 16, face = "bold"),
    axis.title = element_text(size = 13, face = "bold"),
    axis.text = element_text(size = 12, face = "bold"),
    strip.text = element_text(size = 10, face = "bold")
  )
})

GAM_residual_check

#### Showing all 4 figures in single graph

GAM_residual_check[[1]] + GAM_residual_check[[2]] +
  GAM_residual_check[[3]] + GAM_residual_check[[4]] +
  plot_layout(ncol = 2)




###############################################
######## checking with DHARMa package##########

testDispersion(GAM_PM10_deposition_flux_2)
# here GAMMLT is the name of generated model by own model
fig <- simulateResiduals(fittedModel = GAM_PM10_deposition_flux_2, plot = F)
residuals(fig)
plot(fig)
residuals(fig, quantileFunction = qnorm, outlierValues = c(-7,7))

##
plotQQunif(fig) 

plotResiduals(fig) 


### removing test text and beautification
# Re‐plot your QQ‐uniform figure
plotQQunif(
  fig,
  testDispersion = FALSE,
  testUniformity = FALSE,
  testOutliers = FALSE,
  cex.lab   = 2,  
  cex.axis  = 1.6,   
  font.lab  = 2,
  cex.main  = 2.2,
  font.axis = 2
)

##### Manually add the KS test text with your preferred size/position
text(
  x      = 0.7, 
  y      = 0.2, 
  labels = "KS test: p = 0.59\nDeviation: n.s.", 
  cex    = 1.8, 
  font   = 2
)






























