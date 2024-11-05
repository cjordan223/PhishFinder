# Phish-Finder 2.0

 
## Installation and Setup

```
git clone https://github.com/cjordan223/PhishFinder
cd PhishFinder
npm install
npm run build

```


You can store project files here:
https://drive.google.com/drive/folders/15DF2BLvgvxBKGczPNsFGfVOBpZqoIFGX?usp=sharing

1. **Load the Extension:**
   - Open Chrome's Extensions Manager.
   - Select the **dist** folder after clicking **Load Unpacked**.
   - Pin the extension, click login with google and follow the OAuth steps  

2. **Modifying the Application:**
   - [[Building Guide..]](https://docs.google.com/document/d/1SORjKTQUIMlvaz15kTpZVCCLAAwv5P2JFoxT0-4kYsg/edit?usp=sharing)

3. **Build and Reload:**
   - After making any changes, rebuild
     ```bash
     npm run build
     ```
   - Once the build completes, reload the **dist** folder in the Extensions Manager to see chnages. (idk if this is needed but it's in the docs)

   ## To Dos

- [ ] Nav is...better.
- [ ] Need to figure out logic to look for this emails, we can't call the API on every email ($$$$). There is also some path where we aren't using an API at all, but I'm not sure what that looks like.
- [ ] ??

   ![Should look like this when done](https://github.com/cjordan223/phish-finder2.0/blob/b6e9b6cdaef5dc892bb4019303700486f8f5c21b/src/images/picc2.png)
   
   ![Emails when loaded (need better nav) ](https://github.com/cjordan223/phish-finder2.0/blob/b6e9b6cdaef5dc892bb4019303700486f8f5c21b/src/images/picc22.png)

Keep FE up to date with BE