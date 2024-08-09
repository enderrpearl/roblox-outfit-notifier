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
            const outfitres = await fetch('https://avatar.roblox.com/v1/users/1/outfits?page=1&itemsPerPage=1000&isEditable=false',{headers:{cookie:cookie}})
           
            const outfitjson = await outfitres.json()

            if (outfitjson.data) {
                let lastNewOutfitChanged = false
                for (let outfit of outfitjson.data.reverse()) {
                    if (outfit.name !== "Roblox Curated Outfit" && outfit.id > lastNewOutfit) {
                        lastNewOutfit = outfit.id
                        lastNewOutfitChanged = true
                        for (let webhook of webhooks) {
                            webhook.send(`New Outfit!\nName: ${outfit.name}\nCostume Id: ${outfit.id}`)
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