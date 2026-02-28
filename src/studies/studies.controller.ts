import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  NotFoundException,
  HttpException,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
}
from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HttpService } from '@nestjs/axios'; // Para comunicação com o Python
import { lastValueFrom } from 'rxjs';
import { StudiesService, Study, AnalysisResult } from './studies.service';
import { FormData } from 'form-data';

// DTO (Data Transfer Object) para validar o corpo da requisição de renomear
class RenameStudyDto {
  name: string;
}

// DTO para a criação de um estudo
class CreateStudyDto {
    clientName: string;
    type: 'Estudo de Carteira' | 'Relatório de Resultados';
}

@Controller('api/studies')
export class StudiesController {
  constructor(
    private readonly studiesService: StudiesService,
    // O HttpService do NestJS (baseado em Axios) é usado para fazer chamadas HTTP
    // para outros serviços, como o nosso microserviço Python.
    private readonly httpService: HttpService,
  ) {}

  /**
   * Endpoint principal para criar um novo estudo.
   * Recebe um arquivo (PDF/CSV) e metadados, envia para o serviço Python,
   * recebe o resultado da análise e salva no banco de dados (simulado).
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 'file' é o nome do campo no form-data
  async createStudy(
    @UploadedFile() file: Express.Multer.File,
    @Body() createStudyDto: CreateStudyDto,
  ): Promise<Study> {
    if (!file) {
      throw new HttpException('Arquivo não enviado', HttpStatus.BAD_REQUEST);
    }

    const pythonServiceUrl = `${process.env.PYTHON_MICROSERVICE_URL}/api/v1/full-analysis`;
    
    // 1. Montar o form-data para enviar ao Python
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);

    try {
      // 2. Chamar o microserviço Python com o arquivo
      console.log(`Encaminhando arquivo para análise em: ${pythonServiceUrl}`);
      const response = await lastValueFrom(
        this.httpService.post<AnalysisResult>(pythonServiceUrl, formData, {
          headers: { ...formData.getHeaders() },
        }),
      );
      const analysisResult = response.data;

      // 3. Salvar o resultado no nosso banco de dados via serviço
      return this.studiesService.create(
        createStudyDto.clientName,
        createStudyDto.type,
        analysisResult,
      );
    } catch (error) {
      console.error('Erro ao comunicar com o microserviço Python:', error.response?.data);
      throw new HttpException(
        `Falha na análise: ${error.response?.data?.detail || error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Lista todos os estudos e relatórios.
   */
  @Get()
  async findAll(): Promise<Study[]> {
    return this.studiesService.findAll();
  }

  /**
   * Busca um estudo específico pelo ID.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Study> {
    const study = await this.studiesService.findOne(id);
    if (!study) {
      throw new NotFoundException(`Estudo com ID "${id}" não encontrado.`);
    }
    return study;
  }

  /**
   * Renomeia um estudo.
   */
  @Patch(':id/rename')
  async rename(
    @Param('id') id: string,
    @Body() renameStudyDto: RenameStudyDto,
  ): Promise<Study> {
    const study = await this.studiesService.rename(id, renameStudyDto.name);
    if (!study) {
      throw new NotFoundException(`Estudo com ID "${id}" não encontrado.`);
    }
    return study;
  }

  /**
   * Dispara a reanálise de um estudo.
   */
  @Post(':id/reanalyze')
  async reanalyze(@Param('id') id: string): Promise<Study> {
    const study = await this.studiesService.reanalyze(id);
    if (!study) {
      throw new NotFoundException(`Estudo com ID "${id}" não encontrado.`);
    }
    return study;
  }
}
