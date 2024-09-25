const fetch = require('node-fetch')
const { WebhookClient } = require('discord.js')
const fs = require('fs')

//setup dotenv
const dotenv = require('dotenv')
const result = dotenv.config()

if (result.error) {
  throw result.error
}

const sleep = require('node:util').promisify(setTimeout)

const sleepTime = parseInt(process.env.sleepTime) || 1000

//maybe this makes it so i stop running out of fucking tcp ports -_-
const Agent = require('agentkeepalive')
const HttpsAgent = require('agentkeepalive').HttpsAgent
require('node:http').globalAgent = new Agent()
require('node:https').globalAgent = new HttpsAgent()

const cookie = process.env.robloxCookie

const discordWebhook = process.env.discordWebhook 
const webhooks = []
for (let webhook of discordWebhook.split('\n')) {
    webhooks.push(new WebhookClient({url: webhook}))
}
console.log(`setup ${webhooks.length} webhooks`)

if (!fs.existsSync('lastNewOutfit.txt')) {
    fs.writeFileSync('lastNewOutfit.txt','0')
}

let lastNewOutfit = parseInt(fs.readFileSync('lastNewOutfit.txt','utf8'))

//this is a lot easier as we just check for new outfits that are bundles lol
async function main() {
    while (true) {
        try {
            const outfitres = await fetch('https://avatar.roblox.com/v2/avatar/users/1/outfits?page=1&itemsPerPage=500',{headers:{cookie:cookie}})
           
            const outfitjson = await outfitres.json()

            if (outfitjson.data) {
                let lastNewOutfitChanged = false
                let i = 0;
                let reversed = outfitjson.data.reverse()
                let index = reversed.indexOf(reversed.find((outfit)=>outfit.id==lastNewOutfit))
                for (let outfit of reversed) {
                    let thisIndex = reversed.indexOf(outfit)
                    if (outfit.name !== "Roblox Curated Outfit" && thisIndex > index) {
                        lastNewOutfit = outfit.id
                        index = thisIndex
                        lastNewOutfitChanged = true
                        for (let webhook of webhooks) {
                            webhook.send(`New Outfit!\nName: ${outfit.name}\nCostume Id: ${outfit.id}\nOutfit Type: ${outfit.outfitType}`)
                        }
                    }
                }

                if (lastNewOutfitChanged) {
                    fs.writeFileSync('lastNewOutfit.txt',lastNewOutfit.toString())
                }
            } else {
                console.log('rate limit -_-')
            }
        } catch (err) {
            console.warn(err)
        }
        await sleep(sleepTime)
    }
}
main()