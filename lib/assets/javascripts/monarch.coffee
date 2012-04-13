#= require underscore
#= require_self
#= require_tree ./monarch/util
#= require_tree ./monarch

window.Monarch = (recordClassName, columnDefinitions) ->
  class extends Monarch.Record
    @tableName = recordClassName
    @inherited(this)
    @columns(columnDefinitions) if columnDefinitions

_.extend Monarch,
  sandboxUrl: '/sandbox'

  Expressions: {}
  Relations: {}
  Remote: {}
  Util: {}

  fetch: (args...) ->
    Monarch.Remote.Server.fetch(args...)
