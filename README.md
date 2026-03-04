<h1 align="center">XamCent</h1>


<p align="center">
  <a href="#recipe">Recipe</a> |
  <a href="#working">Working</a> |
  <a href="#deployment-steps">Deployment Steps</a> |
  <a href="#file-structure">File Structure</a> |
  <a href="#future-work">Future Work</a> |
  <a href="#about">About</a>
</p>

<p align="center">
  <img src="assets/xamcent-homepage.png" alt="XamCent Homepage" width="900" />
</p>


### The Recipe
XamCent is an interactive web-application built to leverage the power of video analytics and reasoning agents to generate question sets formatted adherent to global paper-setting standards, ready to be handed over to a class across any level of education, from kindergarten all the way to university. Using NVIDIA's video search and summarization (VSS) blueprint and Cosmos-Reason-2 with its video understanding capabilities, it captures key concepts taught from the input video tutorial or livestream and is able to generate an exam set with various question types, across three levels of difficulty. 

The question set can be formatted in line with internationally recognized entrance examinations such as:
1) Scholastic Aptitude Test (SAT) (intl.)
2) Joint Entrance Examination (JEE) (differing formats for "Main" and "Advanced" stages, held in South Asia) 
3) National Higher-Education Entrance Examination/Gao-Kao (held in China)
4) GCSE-A-Level Examination (held in the UK)
5) Graduate Record Examination (GRE) (intl.)
6) Graduate Management Admission Test (GMAT) (intl.)
7) Custom design (allowing a paper-setter to follow their local exam pattern)

### Working
XamCent connects to the VSS blueprint module over the backend, via port 8100. As illustrated in the following workflow:

<p align="center">
  <img src="assets/Gemini_Generated_Image_s46c3cs46c3cs46c.png" alt="VSS-Xamcent-Integration" width="900" />
</p>

1) 📥 **Input Stage** — The user interacts with the XamCent UI and either provides a video file (.mp4,.mov,.avi accepted) or a URL to it, also including entire playlists (excluding those from YouTube owing to their access policy restrictions). This gets passed to the XamCent client which initializes two parallel pipelines.
2) ⚙️ **VSS Ingestion Pipeline** — The input video stream is split into manageable chunks and decoupled from the audio track. The **Cosmos-Reason-2-2B** parameter model analyzes the content shown throughout the video and generates dense video captions along with CV metadata (since the CV and tracking pipeline is also enabled). The separated audio stream is then processed using the **Riva Automatic Speech Recognition (ASR) NIM** (also enabled) to convert essential descriptions and explanations offered by the tutor on a topic during the video, into easily interpretable transcripts. All three outputs — Dense Captions, CV Metadata, and Audio Transcript — feed upward as a Multimodal Dense Caption into the Graph-RAG system.
3) 🧠 **Retrieval Pipeline** — User queries are routed through a context manager and guardrails system, which retrieves semantically relevant video chunks from the vector and graph stores, passes them as grounded context to an LLM, and returns a summary and formatted question set to the user.
4) **Output** — Formatted Question Sets — structured, ready-to-hand-in exam questions derived from the actual video content


### Deployment Steps


#### Requirements

### File Structure

### Future Work

### About

