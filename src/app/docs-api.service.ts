import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

export interface DocPage {
  number: number;
  imageUrl: string;
  id: string;
}

@Service()
export class DocsApiService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'http://localhost:3000';

  getDocs() {
    return this.http.get<DocPage[]>(this.baseUrl + '/pages');
  }
}
