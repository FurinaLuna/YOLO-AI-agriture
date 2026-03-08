import { defineStore } from 'pinia';

interface PredictionResult {
    label: string | string[];
    confidence: string | string[];
    allTime: string;
}

export const useAIStore = defineStore('aiStore', {
    state: () => ({
        // imgPredict states
        imgPredict: {
            predictionResult: {
                label: '',
                confidence: '',
                allTime: '',
            } as PredictionResult,
            aiSuggestion: '',
            loading: false,
            suggestionLoading: false,
            imageUrl: '',
            predictedImageUrl: '',
        },
        // detailsEnv states
        detailsEnv: {
            suggestion: '',
            loading: false,
        },
        // smartChat states
        smartChat: {
            messages: [
                {
                    role: 'assistant',
                    content: '你好！我是你的**智谱 GLM 智能助研**助手，专注于农业科研与作物病虫害防治领域。\n\n你可以向我提问：\n- 🌱 病虫害识别与防治\n- 🌾 农作物栽培技术\n- 📊 产量分析与优化建议\n\n请输入你的问题，我来为你解答！'
                }
            ],
            loading: false,
        },
        // videoPredict states
        videoPredict: {
            aiSuggestion: '',
            loading: false,
        }
    }),
    actions: {
        setImgPredictResult(result: PredictionResult, suggestion: string, img: string, outImg: string) {
            this.imgPredict.predictionResult = result;
            this.imgPredict.aiSuggestion = suggestion;
            this.imgPredict.imageUrl = img;
            this.imgPredict.predictedImageUrl = outImg;
        },
        updateSmartChat(messages: any[]) {
            this.smartChat.messages = messages;
        }
    }
});
