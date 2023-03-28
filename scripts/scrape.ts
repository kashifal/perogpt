import { PGChunk, PGEssay, PGJSON } from "@/types";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { encode } from "gpt-3-encoder";


const base_url = 'https://www.gesetze-im-internet.de/stvo_2013';


const getLinks = async () => {
  const html = await axios.get(`${base_url}/index.html`);
  const $ = cheerio.load(html.data);
  


  const tables = $('table');

  const linksArr : {url: String, title:String }[] = [];


  tables.each((index, item) => { 
    const links = $(item).find("a"); 

    links.each((i, link) => {
      const url = $(link).attr('href');
      const title = $(link).text();
    
      if (url && title) {
        if(url && url.endsWith('.html')){
          const linksObject = {
            url,
            title
          }
          linksArr.push(linksObject);
        };

      
      }
    });
    
    // console.log(linksArr);

   
    
  })
  return linksArr;
  
}



const getEssay = async (url: String, title: String) => { 

  const essay: {title: String, description: String, text: String} = {
    title: '',
    description: ''
  };

  const html = await axios.get(`${base_url}/${url}`); 
  const $ = cheerio.load(html.data);  

  // Get the description from the first two div.jurAbsatz elements


  const pageTitle = $('div h1')
  .slice(0,1)
    .toArray()
    .map(p => $(p).contents().filter(function() {
      return this.nodeType === 3; // Filter out non-text nodes
    }).text().trim())
    .join('\n');

     
  const description = $('div.jurAbsatz')
    .slice(0, 2)
    .toArray()
    .map(p => $(p).text())
    .join('\n');

  essay.title = title.toString();
  essay.description = description;
  essay.text = pageTitle;

  console.log(essay);

  return essay;
}


( async () => {
  const links = await getLinks(); 
  

  let essays = [];

  for (let i = 0; i < links.length; i++) {
    const { url, title } = links[i];
 
    
    const essay = await getEssay(url, title);
    // const chunkedEssay = await chunkEssay(essay);
    essays.push(essay);
  };


  const json =  { 
    essays
  };
  fs.writeFileSync("scripts/pg.json", JSON.stringify(json));
})();   
 


