import HttpException from '#src/domain/exceptions/HttpException'
import crop from './helpers/crop'
import radius from './helpers/radius'
import resize from './helpers/resize'
import rotate from './helpers/rotate'
import convert from './helpers/convert'
import compress from './helpers/compress'
import blur from './helpers/blur'

const transformFormatterMap = {
  crop,
  radius,
  resize,
  rotate,
  convert,
  compress,
  blur,
}

const availableTransformers = Object.keys(transformFormatterMap)

const formatValueByTransformer = (keyword, transformerValue, raw) => {
  return transformFormatterMap[keyword](transformerValue, keyword, raw)
}

const splitParams = (transformers = '') =>
  transformers
    .trim()
    .split('/')
    .filter((param) => !!param)

const splitToObject = (transformers) => {
  const parsedTransformers = splitParams(transformers).reduce(
    (prev, current) => {
      const [transformerKeyWord, ...values] = current.split(':')
      const transformerValue = values.join(':')
      if (!availableTransformers.includes(transformerKeyWord)) {
        throw new HttpException(
          422,
          `unknown transformer "${transformerKeyWord}"`
        )
      }

      return {
        ...prev,
        [transformerKeyWord]: formatValueByTransformer(
          transformerKeyWord,
          transformerValue
        ),
      }
    },
    {}
  )
  return parsedTransformers
}

const formatFromParams = (transformersString) => {
  const transformersObject = splitToObject(transformersString)
  return transformersObject
}

const getTransformersPipeline = (transformersString) => {
  let keyWords = splitParams(transformersString).map((param) => {
    const [keyword] = param.split(':')
    return keyword
  })

  // compress and convert are the same task
  if (keyWords.includes('compress') || keyWords.includes('convert')) {
    const othersTransformers = keyWords.filter(
      (keyword) => !['compress', 'convert'].includes(keyword)
    )
    // compress needs to run first
    keyWords = ['compress', ...othersTransformers]
  }

  if (keyWords.includes('radius')) {
    const othersTransformers = keyWords.filter(
      (keyword) => !['radius'].includes(keyword)
    )
    // radius needs to run last!
    keyWords = [...othersTransformers, 'radius']
  }

  return [...keyWords]
}

export default {
  formatFromParams,
  getTransformersPipeline,
}