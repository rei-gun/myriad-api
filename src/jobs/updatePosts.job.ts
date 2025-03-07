import {CronJob, cronJob} from '@loopback/cron';
import {repository} from '@loopback/repository';
import {
    PeopleRepository,
    PostRepository,
    QueueRepository,
    TagRepository,
    UserCredentialRepository
} from '../repositories';

@cronJob()
export class UpdatePostsJob extends CronJob {
    constructor(
        @repository(PostRepository) public postRepository: PostRepository,
        @repository(PeopleRepository) public peopleRepository: PeopleRepository,
        @repository(TagRepository) public tagRepository: TagRepository,
        @repository(UserCredentialRepository) public userCredentialRepository: UserCredentialRepository,
        @repository(QueueRepository) public queueRepository: QueueRepository
    ) {
        super({
            name: 'update-wallet-address-job',
            onTick: async () => {
                await this.performJob();
            },
            cronTime: '0 0 */1 * * *',
            start: true
        })
    }

    async performJob() {
        try {
            // await this.updatePeoplePost()
            const countCredential = await this.userCredentialRepository.count();

            for (let i = 0; i < countCredential.count; i++) {
                const credential = (await this.userCredentialRepository.find({
                    limit: 1,
                    skip: i
                }))[0];

                const foundPost = await this.postRepository.find({
                    where: {
                        peopleId: credential.peopleId,
                        walletAddress: {
                            nlike: credential.userId
                        }
                    }
                })

                for (let j = 0; j < foundPost.length; j++) {
                    this.postRepository.updateById(foundPost[j].id, {
                        walletAddress: credential.userId
                    })
                }
            }
        } catch (e) { }
    }
}
