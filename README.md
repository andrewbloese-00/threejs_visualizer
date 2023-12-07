# threejs_visualizer
A fun ThreeJS project working with the web Audio APIs to create dynamic visualizations of the users microphone input. To run on your machine see [runnning localy](##Run-Locally)

## Author
Andrew Bloese - December 2023

## Important Notes 
If you want to record the speaker output from your computer, use Google Chrome. Facing difficulties with safari if the audio being played is coming from the same device. Overall this application runs best on Google Chrome. 
[Link To Demo](https://beat-valley-visualizer.web.app)
   

## Technologies Used
1. Vite - build tool
2. ThreeJS - to create and render 3D shapes in the browser
3. Web Audio APIs - using web native audio APIs to access the user's microphone stream with permission as well as performing FFT Analysis of the microphone stream.
4. Firebase Hosting - demo hosted on firebase [Check It Out](https://beat-valley-visualizer.web.app)
   

## Run Locally
1. Open your terminal 
2. `git clone` this repository and `cd` into it.
3. Run `npm install` inside of the cloned repository. 
4. Run `npm run build && npm run preview` 
5. Open google chrome and go to the url output by your terminal after the commands in step 4.
6. Enjoy the pretty colors!

