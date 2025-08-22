library(tidyverse)
library(lubridate)
library(ggplot2)


################################################################
################################################################

###### Berlin NDVI threshold for vegetation phenology

#### Load data and generate right formate of the data 
setwd("C:\\Users\\Azharul Islam\\Desktop\\MethodX\\NDVI")
data_ndvi <- read.csv("Berlin_monthly_mean_NDVI_2014_2020.csv") %>%
  mutate(
    date = mdy(Date),
    month = month(date),
    year = year(date)
  ) %>%
  group_by(month) %>%
  summarise(
    mean_ndvi = mean(NDVI, na.rm = TRUE),
    sd_ndvi = sd(NDVI, na.rm = TRUE)
  ) %>%
  ungroup()

##### Calculate annual min and max, and threshold (20% amplitude with standard phenlogical threshold)
min_ndvi <- min(data_ndvi$mean_ndvi)
max_ndvi <- max(data_ndvi$mean_ndvi)
threshold <- min_ndvi + 0.2 * (max_ndvi - min_ndvi)

##### Find peak month from the data set, which month has with the highest NDVI
peak_month <- data_ndvi$month[which.max(data_ndvi$mean_ndvi)]

###### Detect onset with the first month above threshold before peak
onset <- 4  
offset <- 8 

###### Visualization of the figure with SD and fixed periods
ggplot(data_ndvi, aes(x = month, y = mean_ndvi)) +
  geom_line(color = "darkgreen", linewidth = 1.7) +
  geom_point(color = "forestgreen", size = 5) +
  geom_errorbar(aes(ymin = mean_ndvi - sd_ndvi, ymax = mean_ndvi + sd_ndvi),
                width = 0.3, color = "gray40", linewidth = 0.8) +
  
  geom_hline(yintercept = threshold, linetype = "dashed",
             color = "red", linewidth = 1.6) +
  annotate("rect", xmin = 4, xmax = 9, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "limegreen") +
  annotate("rect", xmin = 9, xmax = 10, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "goldenrod") +
  
 
  annotate("text", x = 1.2, y = max_ndvi, label = "Berlin",
           hjust = .2, vjust = - 2, size = 12, fontface = "bold", color = "black") +
  
  #### Axis and labels of the figure
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  labs(
    x = "Month",
    y = "Mean NDVI",
  ) +
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  scale_y_continuous(labels = scales::number_format(accuracy = 0.01)) +  ## Two decimal places
  
  #### Theme of the figure
  theme_bw(base_size = 30) +
  theme(
    panel.grid.major = element_line(linewidth = 0.001),
    axis.text = element_text(size = 26, face = "bold"),
    axis.title = element_text(size = 30, face = "bold"),
    plot.title = element_text(face = "bold", hjust = 0.5),
    plot.subtitle = element_text(hjust = 0.5)
  )

##### visualize the  results for quick understanding
cat("--- Berlin NDVI (2016-2020 average) ---\n",
    "Min NDVI:", round(min_ndvi, 3), "\n",
    "Max NDVI:", round(max_ndvi, 3), "\n",
    "Threshold (20% amplitude):", round(threshold, 3), "\n",
    "Fixed Vegetation Period: April to August\n",
    "September NDVI:", round(london_ndvi$mean_ndvi[london_ndvi$month == 9], 3), "(Above threshold but excluded)\n")

#### Download the figure with higher dpi
ggsave("data_ndvi.png", width = 10, height = 7, dpi = 300)



##########################################################
##########################################################
###### London NDVI threshold for vegetation phenology

#### Load data and generate right formate of the data 
setwd("C:\\Users\\ajaha\\Desktop\\Review from co-authors\\MethodX\\MethodX\\NDVI")
london_ndvi <- read.csv("London_monthly_mean_NDVI_2014_2020.csv") %>%
  mutate(
    date = mdy(Date),
    month = month(date),
    year = year(date)
  ) %>%
  group_by(month) %>%
  summarise(
    mean_ndvi = mean(NDVI, na.rm = TRUE),
    sd_ndvi = sd(NDVI, na.rm = TRUE)
  ) %>%
  ungroup()

##### Calculate annual min and max, and threshold (20% amplitude with standard phenlogical threshold)
min_ndvi <- min(london_ndvi$mean_ndvi)
max_ndvi <- max(london_ndvi$mean_ndvi)
threshold <- min_ndvi + 0.2 * (max_ndvi - min_ndvi)

##### Find peak month from the data set, which month has with the highest NDVI
peak_month <- london_ndvi$month[which.max(london_ndvi$mean_ndvi)]

###### Detect onset with the first month above threshold before peak
onset <- 4  
offset <- 8 

###### Visualization of the figure with SD and fixed periods
ggplot(london_ndvi, aes(x = month, y = mean_ndvi)) +
  geom_line(color = "darkgreen", linewidth = 1.7) +
  geom_point(color = "forestgreen", size = 5) +
  geom_errorbar(aes(ymin = mean_ndvi - sd_ndvi, ymax = mean_ndvi + sd_ndvi),
                width = 0.3, color = "gray40", linewidth = 0.8) +

  geom_hline(yintercept = threshold, linetype = "dashed",
             color = "red", linewidth = 1.6) +
  annotate("rect", xmin = 4, xmax = 9, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "limegreen") +
  annotate("rect", xmin = 9, xmax = 10, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "goldenrod") +
  annotate("text", x = 1.2, y = max_ndvi, label = "London",
           hjust = 0.2, vjust = -.5, size = 12, fontface = "bold", color = "black") +
  
  
#### Axis and labels of the figure
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  labs(
    x = "Month",
    y = "Mean NDVI",
  ) +
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  scale_y_continuous(labels = scales::number_format(accuracy = 0.01)) +  ## Two decimal places
  
#### Theme of the figure
  theme_bw(base_size = 30) +
  theme(
    panel.grid.major = element_line(linewidth = 0.001),
    axis.text = element_text(size = 26, face = "bold"),
    axis.title = element_text(size = 30, face = "bold"),
    plot.title = element_text(face = "bold", hjust = 0.5),
    plot.subtitle = element_text(hjust = 0.5)
  )

##### visualize the  results for quick understanding
cat("--- London NDVI (2016-2020 average) ---\n",
    "Min NDVI:", round(min_ndvi, 3), "\n",
    "Max NDVI:", round(max_ndvi, 3), "\n",
    "Threshold (20% amplitude):", round(threshold, 3), "\n",
    "Fixed Vegetation Period: April to August\n",
    "September NDVI:", round(london_ndvi$mean_ndvi[london_ndvi$month == 9], 3), "(Above threshold but excluded)\n")

#### Download the figure with higher dpi
ggsave("London_NDVI.png", width = 10, height = 7, dpi = 300)



################################################################
################################################################

###### Stockholm NDVI threshold for vegetation phenology

#### Load data and generate right formate of the data 
setwd("C:\\Users\\ajaha\\Desktop\\Review from co-authors\\MethodX\\MethodX\\NDVI")
data_ndvi <- read.csv("Stockholm_monthly_mean_NDVI_2014_2020.csv") %>%
  mutate(
    date = mdy(Date),
    month = month(date),
    year = year(date)
  ) %>%
  group_by(month) %>%
  summarise(
    mean_ndvi = mean(NDVI, na.rm = TRUE),
    sd_ndvi = sd(NDVI, na.rm = TRUE)
  ) %>%
  ungroup()

##### Calculate annual min and max, and threshold (20% amplitude with standard phenlogical threshold)
min_ndvi <- min(data_ndvi$mean_ndvi)
max_ndvi <- max(data_ndvi$mean_ndvi)
threshold <- min_ndvi + 0.2 * (max_ndvi - min_ndvi)

##### Find peak month from the data set, which month has with the highest NDVI
peak_month <- data_ndvi$month[which.max(data_ndvi$mean_ndvi)]

###### Detect onset with the first month above threshold before peak
onset <- 5  
offset <- 9 

###### Visualization of the figure with SD and fixed periods
ggplot(data_ndvi, aes(x = month, y = mean_ndvi)) +
  geom_line(color = "darkgreen", linewidth = 1.7) +
  geom_point(color = "forestgreen", size = 5) +
  geom_errorbar(aes(ymin = mean_ndvi - sd_ndvi, ymax = mean_ndvi + sd_ndvi),
                width = 0.3, color = "gray40", linewidth = 0.8) +
  
  geom_hline(yintercept = threshold, linetype = "dashed",
             color = "red", linewidth = 1.6) +
  annotate("rect", xmin = 5, xmax = 10, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "limegreen") +
  annotate("rect", xmin = 9, xmax = 10, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "goldenrod") +
  annotate("text", x = 1.2, y = max_ndvi, label = "Stockholm",
           hjust = 0.1, vjust = -.5, size = 12, fontface = "bold", color = "black") +
  
  
  #### Axis and labels of the figure
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  labs(
    x = "Month",
    y = "Mean NDVI",
  ) +
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  scale_y_continuous(labels = scales::number_format(accuracy = 0.01)) +  ## Two decimal places
  
  #### Theme of the figure
  theme_bw(base_size = 30) +
  theme(
    panel.grid.major = element_line(linewidth = 0.001),
    axis.text = element_text(size = 26, face = "bold"),
    axis.title = element_text(size = 30, face = "bold"),
    plot.title = element_text(face = "bold", hjust = 0.5),
    plot.subtitle = element_text(hjust = 0.5)
  )

##### visualize the  results for quick understanding
cat("--- Stockholm NDVI (2016-2020 average) ---\n",
    "Min NDVI:", round(min_ndvi, 3), "\n",
    "Max NDVI:", round(max_ndvi, 3), "\n",
    "Threshold (20% amplitude):", round(threshold, 3), "\n",
    "Fixed Vegetation Period: April to August\n",
    "September NDVI:", round(london_ndvi$mean_ndvi[london_ndvi$month == 9], 3), "(Above threshold but excluded)\n")

#### Download the figure with higher dpi
ggsave("data_ndvi.png", width = 10, height = 7, dpi = 300)




################################################################
################################################################

###### Hong Kong NDVI threshold for vegetation phenology

#### Load data and generate right formate of the data 
setwd("C:\\Users\\ajaha\\Desktop\\Review from co-authors\\MethodX\\MethodX\\NDVI")
data_ndvi <- read.csv("Hong_Kong_monthly_mean_NDVI_2014_2020.csv") %>%
  mutate(
    date = mdy(Date),
    month = month(date),
    year = year(date)
  ) %>%
  group_by(month) %>%
  summarise(
    mean_ndvi = mean(NDVI, na.rm = TRUE),
    sd_ndvi = sd(NDVI, na.rm = TRUE)
  ) %>%
  ungroup()

##### Calculate annual min and max, and threshold (20% amplitude with standard phenlogical threshold)
min_ndvi <- min(data_ndvi$mean_ndvi)
max_ndvi <- max(data_ndvi$mean_ndvi)
threshold <- min_ndvi + 0.15 * (max_ndvi - min_ndvi)

##### Find peak month from the data set, which month has with the highest NDVI
peak_month <- data_ndvi$month[which.max(data_ndvi$mean_ndvi)]

###### Detect onset with the first month above threshold before peak
onset <- 5  
offset <- 9 

###### Visualization of the figure with SD and fixed periods
ggplot(data_ndvi, aes(x = month, y = mean_ndvi)) +
  geom_line(color = "darkgreen", linewidth = 1.7) +
  geom_point(color = "forestgreen", size = 5) +
  geom_errorbar(aes(ymin = mean_ndvi - sd_ndvi, ymax = mean_ndvi + sd_ndvi),
                width = 0.3, color = "gray40", linewidth = 0.8) +
  
  geom_hline(yintercept = threshold, linetype = "dashed",
             color = "red", linewidth = 1.6) +
  annotate("rect", xmin = 5, xmax = 10, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "limegreen") +
  annotate("rect", xmin = 9, xmax = 10, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "goldenrod") +
  annotate("text", x = 1.2, y = max_ndvi, label = "Hong Kong",
           hjust = 0.1, vjust = -.5, size = 12, fontface = "bold", color = "black") +
  
  #### Axis and labels of the figure
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  labs(
    x = "Month",
    y = "Mean NDVI",
  ) +
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  scale_y_continuous(labels = scales::number_format(accuracy = 0.01)) +  ## Two decimal places
  
  #### Theme of the figure
  theme_bw(base_size = 30) +
  theme(
    panel.grid.major = element_line(linewidth = 0.001),
    axis.text = element_text(size = 26, face = "bold"),
    axis.title = element_text(size = 30, face = "bold"),
    plot.title = element_text(face = "bold", hjust = 0.5),
    plot.subtitle = element_text(hjust = 0.5)
  )

##### visualize the  results for quick understanding
cat("--- Hong Kong NDVI (2016-2020 average) ---\n",
    "Min NDVI:", round(min_ndvi, 3), "\n",
    "Max NDVI:", round(max_ndvi, 3), "\n",
    "Threshold (20% amplitude):", round(threshold, 3), "\n",
    "Fixed Vegetation Period: April to August\n",
    "September NDVI:", round(london_ndvi$mean_ndvi[london_ndvi$month == 9], 3), "(Above threshold but excluded)\n")

#### Download the figure with higher dpi
ggsave("data_ndvi.png", width = 10, height = 7, dpi = 300)




################################################################
################################################################
###### Melbourne NDVI threshold for vegetation phenology


#### Load and preprocess data
data_ndvi <- read.csv("Melbourne_monthly_mean_NDVI_2014_2020.csv") %>%
  mutate(
    date = mdy(Date),
    month = month(date),
    year = year(date)
  ) %>%
  group_by(month) %>%
  summarise(
    mean_ndvi = mean(NDVI, na.rm = TRUE),
    sd_ndvi = sd(NDVI, na.rm = TRUE)
  ) %>%
  ungroup()

##### Calculate threshold (20% amplitude)
min_ndvi <- min(data_ndvi$mean_ndvi)
max_ndvi <- max(data_ndvi$mean_ndvi)
threshold <- min_ndvi + 0.2 * (max_ndvi - min_ndvi)  

##### Define Melbourne's vegetation period (Oct-Feb)
onset <- 10  
offset <- 2 


############# Figure visualization
ggplot(data_ndvi, aes(x = month, y = mean_ndvi)) +
  # Data representation
  geom_line(color = "darkgreen", linewidth = 1.7) +
  geom_point(color = "forestgreen", size = 5) +
  geom_errorbar(aes(ymin = mean_ndvi - sd_ndvi, ymax = mean_ndvi + sd_ndvi),
                width = 0.3, color = "gray40", linewidth = 0.8) +
  
  # Threshold and periods
  geom_hline(yintercept = threshold, linetype = "dashed",
             color = "red", linewidth = 1.6) +
  
  # Core vegetation period (Oct-Feb)
  annotate("rect", xmin = 10, xmax = 12, ymin = -Inf, ymax = Inf,  # Oct-Dec
           alpha = 0.2, fill = "limegreen") +
  annotate("rect", xmin = 1, xmax = 3, ymin = -Inf, ymax = Inf,    # Jan-Feb
           alpha = 0.2, fill = "limegreen") +
  annotate("text", x = 1.2, y = max_ndvi, label = "Melbourne",
           hjust = -0.9, vjust = -5.8, size = 12, fontface = "bold", color = "black") +
  
  
  # Shoulder months (Sep, Mar)
  
  annotate("rect", xmin = 3, xmax = 4, ymin = -Inf, ymax = Inf,    # Mar-Apr
           alpha = 0.1, fill = "goldenrod") +
  
  # Clean axis formatting
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  scale_y_continuous(labels = scales::number_format(accuracy = 0.01)) +
  labs(
    x = "Month",
    y = "Mean NDVI",
  )+
  
  # Minimal theme
  theme_bw(base_size = 30) +
  theme(
    panel.grid.major = element_line(linewidth = 0.001),
    axis.text = element_text(size = 26, face = "bold"),
    axis.title = element_text(size = 30, face = "bold"),
    plot.title = element_blank(),
    plot.subtitle = element_blank(),
    plot.caption = element_blank()
  )

# Save figure
ggsave("Melbourne_NDVI.png", width = 10, height = 7, dpi = 300)







################################################################
################################################################

###### Vancouver NDVI threshold for vegetation phenology

#### Load data and generate right formate of the data 
setwd("C:\\Users\\ajaha\\Desktop\\Review from co-authors\\MethodX\\MethodX\\NDVI")
data_ndvi <- read.csv("Vancouver_monthly_mean_NDVI_2014_2020.csv") %>%
  mutate(
    date = mdy(Date),
    month = month(date),
    year = year(date)
  ) %>%
  group_by(month) %>%
  summarise(
    mean_ndvi = mean(NDVI, na.rm = TRUE),
    sd_ndvi = sd(NDVI, na.rm = TRUE)
  ) %>%
  ungroup()

##### Calculate annual min and max, and threshold (20% amplitude with standard phenlogical threshold)
min_ndvi <- min(data_ndvi$mean_ndvi)
max_ndvi <- max(data_ndvi$mean_ndvi)
threshold <- min_ndvi + 0.2 * (max_ndvi - min_ndvi)

##### Find peak month from the data set, which month has with the highest NDVI
peak_month <- data_ndvi$month[which.max(data_ndvi$mean_ndvi)]

###### Detect onset with the first month above threshold before peak
onset <- 4  
offset <- 8 

###### Visualization of the figure with SD and fixed periods
ggplot(data_ndvi, aes(x = month, y = mean_ndvi)) +
  geom_line(color = "darkgreen", linewidth = 1.7) +
  geom_point(color = "forestgreen", size = 5) +
  geom_errorbar(aes(ymin = mean_ndvi - sd_ndvi, ymax = mean_ndvi + sd_ndvi),
                width = 0.3, color = "gray40", linewidth = 0.8) +
  
  geom_hline(yintercept = threshold, linetype = "dashed",
             color = "red", linewidth = 1.6) +
  annotate("rect", xmin = 4, xmax = 9, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "limegreen") +
  annotate("rect", xmin = 9, xmax = 10, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "goldenrod") +
  annotate("text", x = 1.2, y = max_ndvi, label = "Vancouver",
           hjust = 0.2, vjust = -.5, size = 12, fontface = "bold", color = "black") +
  #### Axis and labels of the figure
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  labs(
    x = "Month",
    y = "Mean NDVI",
  ) +
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  scale_y_continuous(labels = scales::number_format(accuracy = 0.01)) +  ## Two decimal places
  
  #### Theme of the figure
  theme_bw(base_size = 30) +
  theme(
    panel.grid.major = element_line(linewidth = 0.001),
    axis.text = element_text(size = 26, face = "bold"),
    axis.title = element_text(size = 30, face = "bold"),
    plot.title = element_text(face = "bold", hjust = 0.5),
    plot.subtitle = element_text(hjust = 0.5)
  )

##### visualize the  results for quick understanding
cat("--- Berlin NDVI (2016-2020 average) ---\n",
    "Min NDVI:", round(min_ndvi, 3), "\n",
    "Max NDVI:", round(max_ndvi, 3), "\n",
    "Threshold (20% amplitude):", round(threshold, 3), "\n",
    "Fixed Vegetation Period: April to August\n",
    "September NDVI:", round(london_ndvi$mean_ndvi[london_ndvi$month == 9], 3), "(Above threshold but excluded)\n")

#### Download the figure with higher dpi
ggsave("data_ndvi.png", width = 10, height = 7, dpi = 300)




################################################################
################################################################

###### New York NDVI threshold for vegetation phenology

#### Load data and generate right formate of the data 
setwd("C:\\Users\\ajaha\\Desktop\\Review from co-authors\\MethodX\\MethodX\\NDVI")
data_ndvi <- read.csv("New_York_monthly_mean_NDVI_2014_2020.csv") %>%
  mutate(
    date = mdy(Date),
    month = month(date),
    year = year(date)
  ) %>%
  group_by(month) %>%
  summarise(
    mean_ndvi = mean(NDVI, na.rm = TRUE),
    sd_ndvi = sd(NDVI, na.rm = TRUE)
  ) %>%
  ungroup()

##### Calculate annual min and max, and threshold (20% amplitude with standard phenlogical threshold)
min_ndvi <- min(data_ndvi$mean_ndvi)
max_ndvi <- max(data_ndvi$mean_ndvi)
threshold <- min_ndvi + 0.2 * (max_ndvi - min_ndvi)

##### Find peak month from the data set, which month has with the highest NDVI
peak_month <- data_ndvi$month[which.max(data_ndvi$mean_ndvi)]

###### Detect onset with the first month above threshold before peak
onset <- 4  
offset <- 8 

###### Visualization of the figure with SD and fixed periods
ggplot(data_ndvi, aes(x = month, y = mean_ndvi)) +
  geom_line(color = "darkgreen", linewidth = 1.7) +
  geom_point(color = "forestgreen", size = 5) +
  geom_errorbar(aes(ymin = mean_ndvi - sd_ndvi, ymax = mean_ndvi + sd_ndvi),
                width = 0.3, color = "gray40", linewidth = 0.8) +
  
  geom_hline(yintercept = threshold, linetype = "dashed",
             color = "red", linewidth = 1.6) +
  annotate("rect", xmin = 4, xmax = 9, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "limegreen") +
  annotate("rect", xmin = 9, xmax = 10, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "goldenrod") +
  annotate("text", x = 1.2, y = max_ndvi, label = "New York",
           hjust = 0.2, vjust = -.001, size = 12, fontface = "bold", color = "black") +
  #### Axis and labels of the figure
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  labs(
    x = "Month",
    y = "Mean NDVI",
  ) +
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  scale_y_continuous(labels = scales::number_format(accuracy = 0.01)) +  ## Two decimal places
  
  #### Theme of the figure
  theme_bw(base_size = 30) +
  theme(
    panel.grid.major = element_line(linewidth = 0.001),
    axis.text = element_text(size = 26, face = "bold"),
    axis.title = element_text(size = 30, face = "bold"),
    plot.title = element_text(face = "bold", hjust = 0.5),
    plot.subtitle = element_text(hjust = 0.5)
  )

##### visualize the  results for quick understanding
cat("--- New York NDVI (2016-2020 average) ---\n",
    "Min NDVI:", round(min_ndvi, 3), "\n",
    "Max NDVI:", round(max_ndvi, 3), "\n",
    "Threshold (20% amplitude):", round(threshold, 3), "\n",
    "Fixed Vegetation Period: April to August\n",
    "September NDVI:", round(london_ndvi$mean_ndvi[london_ndvi$month == 9], 3), "(Above threshold but excluded)\n")

#### Download the figure with higher dpi
ggsave("data_ndvi.png", width = 10, height = 7, dpi = 300)




################################################################
################################################################

###### Los Angeles NDVI threshold for vegetation phenology

#### Load data and generate right formate of the data 
setwd("C:\\Users\\ajaha\\Desktop\\Review from co-authors\\MethodX\\MethodX\\NDVI")
data_ndvi <- read.csv("Los Angeles_monthly_mean_NDVI_2014_2020.csv") %>%
  mutate(
    date = mdy(Date),
    month = month(date),
    year = year(date)
  ) %>%
  group_by(month) %>%
  summarise(
    mean_ndvi = mean(NDVI, na.rm = TRUE),
    sd_ndvi = sd(NDVI, na.rm = TRUE)
  ) %>%
  ungroup()

##### Calculate annual min and max, and threshold (20% amplitude with standard phenlogical threshold)
min_ndvi <- min(data_ndvi$mean_ndvi)
max_ndvi <- max(data_ndvi$mean_ndvi)
threshold <- min_ndvi + 0.2 * (max_ndvi - min_ndvi)

##### Find peak month from the data set, which month has with the highest NDVI
peak_month <- data_ndvi$month[which.max(data_ndvi$mean_ndvi)]

###### Detect onset with the first month above threshold before peak
onset <- 4  
offset <- 8 

###### Visualization of the figure with SD and fixed periods
ggplot(data_ndvi, aes(x = month, y = mean_ndvi)) +
  geom_line(color = "darkgreen", linewidth = 1.7) +
  geom_point(color = "forestgreen", size = 5) +
  geom_errorbar(aes(ymin = mean_ndvi - sd_ndvi, ymax = mean_ndvi + sd_ndvi),
                width = 0.3, color = "gray40", linewidth = 0.8) +
  
  geom_hline(yintercept = threshold, linetype = "dashed",
             color = "red", linewidth = 1.6) +
  annotate("rect", xmin = 4, xmax = 9, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "limegreen") +
  annotate("rect", xmin = 9, xmax = 10, ymin = -Inf, ymax = Inf,
           alpha = 0.2, fill = "goldenrod") +
  annotate("text", x = 1.2, y = max_ndvi, label = "Los Angeles",
           hjust = 0.2, vjust = -3.5, size = 12, fontface = "bold", color = "black") +
  
  #### Axis and labels of the figure
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  labs(
    x = "Month",
    y = "Mean NDVI",
  ) +
  scale_x_continuous(breaks = 1:12, labels = month.abb) +
  scale_y_continuous(labels = scales::number_format(accuracy = 0.01)) +  ## Two decimal places
  
  #### Theme of the figure
  theme_bw(base_size = 30) +
  theme(
    panel.grid.major = element_line(linewidth = 0.001),
    axis.text = element_text(size = 26, face = "bold"),
    axis.title = element_text(size = 30, face = "bold"),
    plot.title = element_text(face = "bold", hjust = 0.5),
    plot.subtitle = element_text(hjust = 0.5)
  )

##### visualize the  results for quick understanding
cat("--- Los Angeles NDVI (2016-2020 average) ---\n",
    "Min NDVI:", round(min_ndvi, 3), "\n",
    "Max NDVI:", round(max_ndvi, 3), "\n",
    "Threshold (20% amplitude):", round(threshold, 3), "\n",
    "Fixed Vegetation Period: April to August\n",
    "September NDVI:", round(london_ndvi$mean_ndvi[london_ndvi$month == 9], 3), "(Above threshold but excluded)\n")

#### Download the figure with higher dpi
ggsave("data_ndvi.png", width = 10, height = 7, dpi = 300)





