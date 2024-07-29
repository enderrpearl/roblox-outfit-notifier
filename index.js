const fetch = require('node-fetch')
const { WebhookClient } = require('discord.js')

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

//15 = group mention
//17 = watching first post
const notificationTypes = [15, 17]

//just the webhook url lol
const discordWebhook = process.env.discordWebhook 

const webhooks = []
for (let webhook of discordWebhook.split('\n')) {
    webhooks.push(new WebhookClient({url: webhook}))
}
console.log(`setup ${webhooks.length} webhooks`)

let lastNewOutfit = 0

//this is a lot easier as we just check for new outfits that are bundles lol
async function main() {
    while (true) {
        try {
            const outfitres = await fetch('https://avatar.roblox.com/v1/users/1/outfits?page=1&itemsPerPage=1000&isEditable=false',{headers:{cookie:cookie}})
           
            const outfitjson = await outfitres.json()

            if (outfitjson.data) {
                for (let outfit of outfitjson.data.reverse()) {
                    if (outfit.name !== "Roblox Curated Outfit" && outfit.id > lastNewOutfit) {
                        lastNewOutfit = outfit.id
                        for (let webhook of webhooks) {
                            webhook.send(`New Outfit!\nName: ${outfit.name}\nCostume Id: ${outfit.id}`)
                        }
                    }
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