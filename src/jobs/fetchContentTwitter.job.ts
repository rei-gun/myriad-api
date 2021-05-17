import {inject} from '@loopback/core'
import {CronJob, cronJob} from '@loopback/cron'
import {repository} from '@loopback/repository'
import {Keyring} from '@polkadot/api'
import { KeypairType } from '@polkadot/util-crypto/types'
import {
  PeopleRepository,
  PostRepository,


  PublicMetricRepository, TagRepository,
  UserCredentialRepository
} from '../repositories'
import {Twitter} from '../services'

@cronJob()
export class FetchContentTwitterJob extends CronJob {
  constructor(
    @inject('services.Twitter') protected twitterService: Twitter,
    @repository(PostRepository) public postRepository: PostRepository,
    @repository(PeopleRepository) public peopleRepository: PeopleRepository,
    @repository(TagRepository) public tagRepository: TagRepository,
    @repository(UserCredentialRepository) public userCredentialRepository: UserCredentialRepository,
    @repository(PublicMetricRepository) public publicMetricRepository: PublicMetricRepository
  ) {
    super({
      name: 'fetch-content-twitter-job',
      onTick: async () => {
        await this.performJob();
      },
      cronTime: '0 0 */1 * * *', // Every hour
      start: true
    })
  }

  async performJob() {
    try {
      await this.searchPostByTag()
    } catch (e) { }
  }

  async searchPostByTag(): Promise<void> {
    try {
      const keyring = new Keyring({
        type: process.env.POLKADOT_CRYPTO_TYPE as KeypairType, 
        ss58Format: Number(process.env.POLKADOT_KEYRING_PREFIX)
      });
      const tagsRepo = await this.tagRepository.find()

      for (let i = 0; i < tagsRepo.length; i++) {
        const tag = tagsRepo[i]
        const tweetField = 'referenced_tweets,attachments,entities,created_at,public_metrics'
        const {data: newPosts, includes} = await this.twitterService.getActions(`tweets/search/recent?max_results=10&tweet.fields=${tweetField}&expansions=author_id&user.fields=id,username&query=${tag.id}`)

        if (!newPosts) continue

        const {users} = includes
        const filterNewPost = newPosts.filter((post: any) => !post.referenced_tweets)

        for (let j = 0; j < filterNewPost.length; j++) {
          const post = filterNewPost[j]
          const foundPost = await this.postRepository.findOne({where: {textId: post.id, platform: 'twitter'}})

          if (foundPost) {
            const foundTag = foundPost.tags.find(postTag => postTag.toLowerCase() === tag.id.toLowerCase())

            if (!foundTag) {
              const tags = [...foundPost.tags, tag.id]

              await this.postRepository.updateById(foundPost.id, {tags})
            }

            continue
          }

          const username = users.find((user: any) => user.id === post.author_id).username
          const tags = post.entities ? (post.entities.hashtags ? post.entities.hashtags.map((hashtag: any) => hashtag.tag.toLowerCase()) : []) : []
          const hasMedia = post.attachments ? Boolean(post.attachments.media_keys) : false
          const foundPeople = await this.peopleRepository.findOne({where: {platform_account_id: post.author_id}})
          const platformPublicMetric = {
            retweet_count: post.public_metrics.retweet_count,
            like_count: post.public_metrics.like_count
          }
          
          const newPost = {
            tags: tags.find((tagPost: string) => tagPost.toLowerCase() === tag.id.toLowerCase()) ? tags : [...tags, tag.id],
            hasMedia,
            platform: 'twitter',
            text: post.text,
            textId: post.id,
            link: `https://twitter.com/${post.author_id}/status/${post.id}`,
            platformUser: {
              username,
              platform_account_id: post.author_id
            },
            platformCreatedAt: post.created_at,
            platformPublicMetric: platformPublicMetric
          }

          await this.createTags(newPost.tags)

          if (foundPeople) {
            const userCredential = await this.userCredentialRepository.findOne({where: {peopleId: foundPeople.id}})

            if (userCredential) {
              const result = await this.postRepository.create({
                ...newPost,
                peopleId: foundPeople.id,
                walletAddress: userCredential.userId
              })
              await this.publicMetricRepository.create({
                liked: 0,
                comment: 0,
                disliked: 0,
                postId: result.id
              })
            }

            const result = await this.postRepository.create({
              ...newPost,
              peopleId: foundPeople.id
            })
            const newKey = keyring.addFromUri('//' + result.id)

            await this.postRepository.updateById(result.id, {walletAddress: newKey.address})
            await this.publicMetricRepository.create({
              liked: 0,
              comment: 0,
              disliked: 0,
              postId: result.id
            })
          }

          const result = await this.postRepository.create(newPost)
          const newKey = keyring.addFromUri('//' + result.id)

          await this.postRepository.updateById(result.id, {walletAddress: newKey.address})
          await this.publicMetricRepository.create({
            liked: 0,
            comment: 0,
            disliked: 0,
            postId: result.id
          })
        }
      }
    } catch (e) { }
  }

  async createTags(tags:string[]):Promise<void> {
     const fetchTags = await this.tagRepository.find()
     const filterTags = tags.filter((tag:string) => {
       const foundTag = fetchTags.find((fetchTag:any) => fetchTag.id.toLowerCase() === tag.toLowerCase())

       if (foundTag) return false
       return true
     })

     if (filterTags.length === 0) return

     await this.tagRepository.createAll(filterTags.map((filterTag:string) => {
       return {
         id: filterTag,
         hide: false
       }
     }))
  }
}
