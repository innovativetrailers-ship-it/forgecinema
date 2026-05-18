import { runModel1 } from '../brain/model1'
import { FilmDirector } from '../film/FilmDirector'
import { db } from '../db'

interface SeriesBible {
  premise: string
  logline: string
  world_building: string
  tone_and_style: string
  recurring_themes: string[]
  episode_formula: string
  character_archetypes: Array<{ name: string; role: string; arc: string }>
  visual_style: string
  music_style: string
  season_arcs: Array<{ season: number; arc: string; themes: string[] }>
}

interface EpisodeFormat { runtime: number; structure: string[] }

export class SeriesManager {
  private filmDirector = new FilmDirector()

  async generateSeriesBible(params: {
    concept: string
    type: string
    platform: string
    episodeCount: number
    episodeRuntime: number
  }): Promise<SeriesBible> {
    const response = await runModel1({
      systemPrompt: `You are a TV showrunner and series developer. Create a complete series bible from the given concept.
Return JSON: {
  "premise": string,
  "logline": string,
  "world_building": string,
  "tone_and_style": string,
  "recurring_themes": [string],
  "episode_formula": string,
  "character_archetypes": [{ "name": string, "role": string, "arc": string }],
  "visual_style": string,
  "music_style": string,
  "season_arcs": [{ "season": 1, "arc": string, "themes": [string] }]
}`,
      userMessage: `Concept: ${params.concept}\nType: ${params.type}\nPlatform: ${params.platform}\nEpisode runtime: ${params.episodeRuntime} minutes`,
      requireJSON: true,
      useAgenticLoop: true,
    })
    return JSON.parse(response.content)
  }

  async generateEpisode(params: {
    seriesId: string
    seasonNumber: number
    episodeNumber: number
    episodeBrief: string
    tier: 'Draft' | 'Studio' | 'Blockbuster'
    userId: string
  }): Promise<string> {
    const series = await db.seriesProject.findUnique({ where: { id: params.seriesId } })
    if (!series) throw new Error('Series not found')

    const bible = series.seriesBible as unknown as SeriesBible
    const format = series.episodeFormat as unknown as EpisodeFormat

    const scriptResponse = await runModel1({
      systemPrompt: `You are the showrunner for ${series.title}. Write an episode following the series bible exactly.
Bible: ${JSON.stringify(bible)}
Episode format: ${JSON.stringify(format)}
Return Fountain-format screenplay.`,
      userMessage: `Season ${params.seasonNumber}, Episode ${params.episodeNumber}\nBrief: ${params.episodeBrief}`,
      requireJSON: false,
      useAgenticLoop: true,
    })

    await this.filmDirector.parseFountainScript(scriptResponse.content)

    const season = await db.season.findFirst({
      where: { seriesId: params.seriesId, seasonNumber: params.seasonNumber }
    })

    await db.episode.create({
      data: {
        seasonId: season!.id,
        episodeNumber: params.episodeNumber,
        title: `Episode ${params.episodeNumber}`,
        logline: params.episodeBrief,
        targetRuntime: format.runtime ?? 22,
        status: 'in_production',
        actBreaks: [],
        tags: [],
        sceneIds: [],
      }
    })

    const tempFilm = await db.filmProject.create({
      data: {
        userId: params.userId,
        title: `${series.title} S${params.seasonNumber}E${params.episodeNumber}`,
        type: 'FEATURE_FILM',
        targetRuntime: format.runtime ?? 22,
        status: 'PRODUCTION',
      }
    })

    return this.filmDirector.produceFullFilm({
      filmProjectId: tempFilm.id,
      tier: params.tier,
      userId: params.userId,
    })
  }

  async generateSocialEpisode(params: {
    seriesId: string
    episodeNumber: number
    topic: string
    tier: 'Draft' | 'Studio' | 'Blockbuster'
    userId: string
  }): Promise<string> {
    const series = await db.seriesProject.findUnique({ where: { id: params.seriesId } })
    if (!series) throw new Error('Series not found')

    const bible = series.seriesBible as unknown as SeriesBible
    const format = series.episodeFormat as unknown as EpisodeFormat

    const response = await runModel1({
      systemPrompt: `Generate a shot list for a social media series episode. Follow the series format exactly.
Include: series intro (3s), content shots, series outro (3s). Maintain consistent visual brand.
Bible: ${JSON.stringify(bible)}. Return JSON shot array.`,
      userMessage: `Episode ${params.episodeNumber} topic: ${params.topic}`,
      requireJSON: true,
    })

    const shots = JSON.parse(response.content)
    const { SwarmRouter } = await import('../swarm/SwarmRouter')
    const swarm = new SwarmRouter()

    const shotList = await swarm.decompose({
      userInput: shots.map((s: { description: string }) => s.description).join('. '),
      tier: params.tier,
      userId: params.userId,
    })

    const results = await swarm.dispatch({
      shotList,
      userId: params.userId,
      projectId: params.seriesId,
    })

    const { SeamlessBlender } = await import('../swarm/SeamlessBlender')
    const blender = new SeamlessBlender()
    return blender.blend({ results, shots: shotList.shots, applyHouseLook: true })
  }
}
