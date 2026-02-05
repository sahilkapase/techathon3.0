# **GrowFarm**
<img src="https://github.com/user-attachments/assets/68244cdd-d6f8-4625-b720-71bc1e4a886a" alt="Logo" width="2000"> 

## 💥 Introduction

The proposed portal aims to provide a comprehensive and integrated platform for farmers, offering a range of features and services to enhance their agricultural practices. It addresses the challenges faced by farmers who need to navigate multiple platforms for information and services related to schemes, land details, APMC markets, and smart farming techniques. By providing a unique farmer ID and centralizing information, the portal streamlines access to crucial data such as scheme notifications, land details, APMC history, and facilitates processes like applying for loans and insurance.

Moreover, the portal incorporates smart farming capabilities, utilizing machine learning, artificial intelligence, and the internet of things to assist farmers with crop recommendations, disease detection, yield prediction, and weather forecasting. With the potential to make accurate future predictions based on collected farmer data, the portal holds promise in empowering farmers with valuable insights and resources for improved decision-making and agricultural outcomes.

It is built using React for the frontend, Express, Sockets Server, and Twilio for SMS service and communication, and MongoDB for the database and machine learning algorithms for disease detection, crop prediction, and crop recommendation.

## 💡 Why did we build this?

The portal was built to address the challenges faced by farmers in accessing crucial agricultural information and services. It aims to streamline decision-making by providing a centralized platform with a unique farmer ID for accessing schemes, land details, APMC history, and smart farming capabilities. The goal is to empower farmers with valuable insights, improve their decision-making, and enhance overall agricultural outcomes.

## 🚀 Technologies Used  

### 🧠 Machine Learning & AI  
| Technology | Description |
|------------|-------------|
| ![XGBoost](https://img.shields.io/badge/XGBoost-EB5B3C?style=for-the-badge&logo=xgboost&logoColor=white) | Extreme Gradient Boosting for optimized ML models |
| ![Mask R-CNN](https://img.shields.io/badge/Mask%20R--CNN-252525?style=for-the-badge) | Instance segmentation for object detection |
| ![RAG](https://img.shields.io/badge/RAG-FF9900?style=for-the-badge) | Retrieval-Augmented Generation for enhanced AI responses |
| ![Hugging Face](https://img.shields.io/badge/Huggingface-FFCC00?style=for-the-badge&logo=huggingface&logoColor=white) | Pre-trained NLP models & transformers |
| ![LangChain](https://img.shields.io/badge/LangChain-02569B?style=for-the-badge) | Framework for developing LLM-powered applications |

---

### 🌍 Web Technologies  
| Technology | Description |
|------------|-------------|
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) | Backend JavaScript runtime |
| ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white) | Frontend UI framework |
| ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white) | High-performance web framework for APIs |
| ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white) | NoSQL database for scalable storage |
| ![OpenWeather API](https://img.shields.io/badge/OpenWeather-FF8000?style=for-the-badge) | Real-time weather data integration |
| ![Dialogflow](https://img.shields.io/badge/Dialogflow-FF9800?style=for-the-badge&logo=dialogflow&logoColor=white) | Conversational AI & chatbot framework |
| ![Twilio API](https://img.shields.io/badge/Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white) | SMS & communication integration |

### 📱 Android Technology Stack

| 🛠️ Technology | 📋 Purpose in the Farmer‑Portal App |
|---------------|------------------------------------|
| ⚡ **Kotlin** | Modern, null‑safe language powering the whole app |
| 🎨 **Jetpack Compose + Material 3** | Declarative UI & sleek components for every screen |
| 🧭 **Navigation Compose** | Smooth, type‑safe in‑app routing (Home → Weather → Chatbot …) |
| 📊 **ViewModel + StateFlow** | Lifecycle‑aware reactive state management |
| 🌐 **Retrofit 2 & OkHttp 5** | Type‑safe REST client for all backend services |
| 🔄 **Coroutines + WorkManager** | Lightweight async ops & scheduled alerts (weather, schemes) |
| 💾 **Room** | Local caching of APMC prices, schemes & offline data |
| 🔗 **Hilt** | Dependency injection for singletons, repositories, ViewModels |
| 🔔 **Firebase Cloud Messaging** | Push notifications for subsidy & weather alerts |
| 🤖 **TensorFlow Lite** | On‑device crop‑disease detection & yield inference |

---

## 🛠️ Local development

That's pretty easy. To ensure that you are able to install everything properly, we would recommend you to have <b>Git</b>, <b>NPM</b> and <b>Node.js</b> installed.

1️⃣ We will first start with setting up the Local Project Environment:

```sh
git clone https://github.com/Neelpatel11/Growfarm-Digital-farmer-portal.git
cd Growfarm-Digital-farmer-portal
npm run install
```
Now we will add the environment variables in the client/ and server/

**2️⃣ Client**
```sh
cd client
npm install
npm start
```
For server setup, you need to add your MongoDB database URL to /config/mongoose.js.

**3️⃣ Server**
```sh
cd server
npm install
npm start
```

**4️⃣ FastAPI Setup**
```sh
cd  ML FAST API
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 🚜 Key Features of Growfarm  

### 👤 Digital Farmer Profile  
- Every farmer gets a **unique Farmer ID** after registration.  
- The **Farmer ID** helps in tracking:  
  - 🌱 **Farm Information**  
  - 📜 **Eligible Schemes**  
  - 📝 **Scheme Application History**  
  - 💰 **Billing & Loan History**  
  - 🛡️ **Insurance Records**  

---

### 🌾 Smart Farming (Crop Recommendation System)  
- Farmers receive **crop recommendations** based on:  
  - 🧪 **Soil Parameters** (Nitrogen, Phosphorus, Potassium levels)  
  - 🌦️ **Weather Conditions**  

---

### 🌦️ Weather Broadcast & Alerts  
- **Real-time weather updates** to help farmers plan their agricultural activities.  
- 🚨 **Bad weather alerts** to protect crops and prevent losses.  

---

### 📢 Alerts & Updates on New Schemes & Subsidies  
- 📜 **Timely notifications** about government schemes & financial aid.  
- 🚀 Helps farmers take advantage of available **subsidies & benefits**.  

---

### 🏛️ Schemes Application & Tracking  
- Farmers can **browse and apply** for schemes directly on the platform.  
- 🔄 **Real-time tracking** of application status.  

---

### 🎯 **AS-4: Enhanced Scheme Access & Support** ⭐ NEW  

#### 🔍 Smart Eligibility Filtering
- **Advanced filtering** based on:
  - 🌾 **Crop Type** (Wheat, Rice, Cotton, Sugarcane, etc.)
  - 📏 **Land Size** (Automatic matching with farmer's land holdings)
  - 📍 **Location** (District, Taluka, Village)
  - 🌱 **Season** (Kharif, Rabi, Zaid, Year Round)
- **Real-time scheme count** as filters are applied
- Only shows schemes farmer is eligible for and hasn't applied to yet

#### 🛡️ Insurance Options Display
- **Comprehensive insurance information** for each scheme:
  - Insurance provider details
  - Coverage amount (up to ₹2 lakhs)
  - Premium costs
  - Policy descriptions
- Compare multiple insurance options side-by-side
- Insurance details included in downloadable PDFs

#### 🎤 Voice Input (Regional Languages)
- **6 Indian languages supported**:
  - 🇮🇳 English, हिंदी (Hindi), ગુજરાતી (Gujarati)
  - मराठी (Marathi), தமிழ் (Tamil), తెలుగు (Telugu)
- Voice search for schemes with animated microphone
- Language selector for preferred input method
- Hands-free scheme discovery

#### 📄 Auto-filled Application Forms
- **One-click PDF generation** with:
  - ✅ Farmer details pre-filled (ID, Name, Category, Location, Contact)
  - ✅ Scheme information (Title, Benefits, Deadlines, Subsidy)
  - ✅ Insurance options table
  - ✅ Professional formatting ready for submission
- Saves time and reduces errors in applications

#### ⏰ Deadline Reminders
- **Automated WhatsApp notifications** for:
  - Schemes expiring in 3-7 days
  - Pending applications approaching deadline
  - Urgent action required alerts
- Visual deadline badges showing days remaining
- Red "urgent" indicators for schemes expiring within 7 days

#### 💰 Subsidy Tracking
- **Clear subsidy information** display:
  - Subsidy amounts prominently shown
  - Visual money icons for easy identification
  - Detailed subsidy breakdown in scheme details
  - "As per guidelines" for variable subsidies

#### 🗣️ Simple Language Explanations
- **Toggle between technical and simple language**
- Farmer-friendly explanations in regional languages
- Complex government schemes explained simply
- Helps farmers understand benefits and eligibility clearly

#### 📱 WhatsApp Integration
- **Instant notifications** via WhatsApp for:
  - New schemes matching farmer's profile
  - Application status updates
  - Deadline reminders
  - Important scheme announcements

---

### 🧾 APMC Billing History  
- 📊 **Digital billing system** for tracking sales & payments.  
- ✅ Ensures **transparency & accountability** in transactions.  
- 📈 Helps in maintaining **organized financial records**.  

---

### 🌍 Farm Information Integration  
- Farmers can **verify Aadhaar details** to access their farm data.  
- 🖥️ Direct integration with **ANY ROR (Record of Rights)** system.  
- 🔗 All farm-related details in **one unified portal**—no need for multiple logins.  

---

## 🧾 Class Diagram

![Class diagram](https://user-images.githubusercontent.com/83646676/227933827-aa99f4fa-dd6e-4195-9757-63b6fdb0257c.png)

## 🧾 ER diagram of farmer portal:

![Farmer portal ER Diagram](https://user-images.githubusercontent.com/83646676/227935603-30440d00-b4b6-417d-8726-2195d0c5ea90.png)

## 🧾 ER diagram of government portal:

![Government portal Er Diagram](https://user-images.githubusercontent.com/83646676/227935683-71373929-2e04-4ba3-b89a-002742eff438.png)

## 💻 Interface design of farmer portal:

### Farmer’s registration form

![Registration](https://user-images.githubusercontent.com/83646676/227987002-147bcf12-5d1a-431a-bad8-9f1df7049864.png)

###  Farmer’s profile page

![FPP](https://user-images.githubusercontent.com/83646676/227987187-29cc2ca0-8526-45dd-bb5e-085bd5932287.png)

### GrowFarm App 

![image](https://github.com/user-attachments/assets/af5dc674-4637-4097-994f-3966f5e7c508)


### Hourly Weather forecast

![HWF](https://user-images.githubusercontent.com/83646676/227987425-616763f5-ade8-47fe-8a37-9eea8f0ea92d.png)

### APMC billing history at farmer side

![APMC](https://user-images.githubusercontent.com/83646676/227987902-e30ed926-316c-4a10-90c5-65f7f5bbd97c.png)

### Dashboard to analysis category wise registered farmers 

![dacwrf](https://user-images.githubusercontent.com/83646676/227988066-48f01abe-9ddc-4ad9-8c24-87fbfd22fc5d.png)

### Find farmer functionality 

![FFf](https://user-images.githubusercontent.com/83646676/227988262-3f58415e-3628-4559-8146-cea0f4eeee58.png)

### Admin side scheme dashboard

![Assd](https://user-images.githubusercontent.com/83646676/227988511-97d3a365-4898-4f94-8bba-555c247a8a40.png)

### Analysis dashboard for particular scheme 

![adfps](https://user-images.githubusercontent.com/83646676/227989156-eaf1e61a-bb40-4dbf-9590-ac39c10ce2b7.png)

### District wise soil analysis 

![DWSA](https://user-images.githubusercontent.com/83646676/227989307-62233f61-dea6-4766-baa7-902c2d74a4c2.png)

### Crop wise area, production and yield analysis 

![CWAPAYA](https://user-images.githubusercontent.com/83646676/227989974-7d4abb1a-8cb1-4c44-afdf-573b84691caa.png)

### Trader side digital bill generator 

![TSDBG](https://user-images.githubusercontent.com/83646676/227990534-78b3f3ce-5795-4f1b-a3c9-02c9de0826b7.png)


### Digital billing history

![Dhh](https://user-images.githubusercontent.com/83646676/227990730-0ec07b40-c74e-455f-9637-d7ac4406fbf8.png)


## 🎬 Video demo of Growfarm Ui


https://user-images.githubusercontent.com/83646676/227994431-19456186-d09d-4b97-bc8a-d9c06d3121a7.mp4



https://user-images.githubusercontent.com/83646676/227994504-b990925b-2561-4db5-8b1b-ee7792cedc0f.mp4



https://user-images.githubusercontent.com/83646676/227994510-20b4a2d4-59c5-435a-a285-571e75fbd67f.mp4



https://user-images.githubusercontent.com/83646676/227994525-c63d7e5e-6aa3-41aa-855b-f0cfb350f7ea.mp4



https://user-images.githubusercontent.com/83646676/227994536-026f6a4b-ffc6-406e-94b7-ab215755f04f.mp4



https://user-images.githubusercontent.com/83646676/227994553-cc59698a-cd75-4ec5-bd1f-5e0456d3a210.mp4



#   t e c h a t h o n 3 . 0  
 #   t e c h a t h o n 3 . 0  
 