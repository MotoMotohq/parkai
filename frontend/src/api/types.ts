export interface Landmark {
  type: string
  value: string
  confidence: number
  matched: boolean
}

export interface ParkingLocation {
  id: string
  floor: string
  zone: string
  row: number
  parking_number: string
  image_url: string
  landmarks: Landmark[]
  is_demo: boolean
  created_at: string
}

export interface SaveResult {
  location: ParkingLocation
  confidence: number
  detected_landmarks: Landmark[]
}

export interface Candidate {
  location: ParkingLocation
  similarity: number
}

export interface SearchResult {
  search_id: string
  query_image_url: string
  candidates: Candidate[]
  best_match: Candidate
  matched_landmarks: Landmark[]
  locations_analyzed: number
  search_time_ms: number
}

export interface Analytics {
  total_locations: number
  total_test_images: number
  correct_matches: number
  top1_accuracy: number
  average_search_time_ms: number
  is_demo_benchmark: boolean
}

export interface TestCaseResult {
  test_id: string
  expected_location: string
  predicted_location: string
  similarity: number
  correct: boolean
}

export interface RunTestResult {
  results: TestCaseResult[]
  analytics: Analytics
}
