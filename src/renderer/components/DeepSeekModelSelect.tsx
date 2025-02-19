import { Select, MenuItem, FormControl, InputLabel, TextField } from '@mui/material'
import { ModelSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import { models } from '../packages/models/deepseek'

export interface Props {
    deepseekModel: ModelSettings['deepseekModel']
    onChange(model: ModelSettings['deepseekModel'], deepseekModel: ModelSettings['deepseekModel']): void
    className?: string
}

export default function DeepSeekModelSelect(props: Props) {
    const { t } = useTranslation()
    return (
        <FormControl fullWidth variant="outlined" margin="dense" className={props.className}>
            <InputLabel htmlFor="model-select">{t('model')}</InputLabel>
            <Select
                label={t('model')}
                id="model-select"
                value={props.deepseekModel}
                onChange={(e) => props.onChange(e.target.value as ModelSettings['deepseekModel'], props.deepseekModel)}
            >
                {models.map((model) => (
                    <MenuItem key={model} value={model}>
                        {model}
                    </MenuItem>
                ))}
                <MenuItem key="custom-model" value={'custom-model'}>
                    {t('Contact sales for your customer model')}
                </MenuItem>
            </Select>
        </FormControl>
    )
}
