import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import { createJobsService } from '~/services/jobs/jobsService'
import type { Job } from '~/services/types'
import type { JobListParams } from '~/services/jobs/jobsService'

// Combined list item — jobs and seekers rendered in the same feed
// We use a flat shape rather than extending `Job` to avoid strictness
// conflicts caused by `Job.created_at` being required vs. `JobSeeker`
// not having it.
interface FeedItem {
  id: number
  itemType: 'job' | 'seeker'
  status?: string
  title?: string
  name?: string
  created_at?: string
  createdAt?: string
  [key: string]: unknown
}

export const useJobs = () => {
  const api = useApi()
  const jobsService = createJobsService(api)

  const jobs = ref<FeedItem[]>([])
  const selectedJob = ref<Job | null>(null)
  const loading = ref(false)
  const error = ref('')

  const openJobs = computed((): FeedItem[] =>
    jobs.value.filter((job) => job.status === 'open' || job.itemType === 'seeker')
  )

  const fetchJobs = async (params: JobListParams = {}): Promise<FeedItem[]> => {
    loading.value = true
    error.value = ''
    try {
      const [jobsResponse, seekersResponse] = await Promise.all([
        jobsService.list(params),
        jobsService.listSeekers({ search: params['search'] as string | undefined }),
      ])

      const jobsList: FeedItem[] = (jobsResponse.data || []).map((j) => ({
        ...j,
        itemType: 'job' as const,
      }))
      const seekersList: FeedItem[] = (seekersResponse.data || []).map((s) => ({
        ...s,
        itemType: 'seeker' as const,
      }))

      const combined: FeedItem[] = [...jobsList, ...seekersList].sort((a, b) => {
        const dateA = new Date(a.createdAt ?? a.created_at ?? 0).getTime()
        const dateB = new Date(b.createdAt ?? b.created_at ?? 0).getTime()
        return dateB - dateA
      })

      jobs.value = combined
      return jobs.value
    } catch (err) {
      const e = err as Error
      error.value = e.message || 'Unable to fetch jobs and seekers'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCompanyJobs = async (params: JobListParams = {}): Promise<FeedItem[]> => {
    loading.value = true
    error.value = ''
    try {
      const response = await jobsService.listCompanyJobs(params)
      jobs.value = (response.data || []).map((j) => ({ ...j, itemType: 'job' as const }))
      return jobs.value
    } catch (err) {
      const e = err as Error
      error.value = e.message || 'Unable to fetch company jobs'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchJobById = async (jobId: number | string): Promise<Job> => {
    loading.value = true
    error.value = ''
    try {
      const response = await jobsService.getById(jobId)
      selectedJob.value = response.data
      return response.data
    } catch (err) {
      const e = err as Error
      error.value = e.message || 'Unable to fetch job details'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createJob = async (payload: Partial<Job> & Record<string, unknown>): Promise<Job> => {
    const response = await jobsService.create(payload)
    if (response.data) {
      jobs.value = [{ ...response.data, itemType: 'job' as const }, ...jobs.value]
    }
    return response.data
  }

  const updateJob = async (jobId: number | string, payload: Partial<Job> & Record<string, unknown>): Promise<Job> => {
    const response = await jobsService.update(jobId, payload)
    if (response.data) {
      jobs.value = jobs.value.map((job) =>
        job.id === jobId ? { ...response.data, itemType: 'job' as const } : job
      )
      if (selectedJob.value?.id === jobId) {
        selectedJob.value = response.data
      }
    }
    return response.data
  }

  return {
    jobs,
    selectedJob,
    loading,
    error,
    openJobs,
    fetchJobs,
    fetchCompanyJobs,
    fetchJobById,
    createJob,
    updateJob,
  }
}
